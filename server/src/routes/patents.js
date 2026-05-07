const express = require('express');
const { protect } = require('../middleware/auth');
const { callOpenRouter, parseAIJson } = require('../services/openrouterService');
const { searchPatentsView, analyzePatentsWithAI } = require('../services/patentService');
const { getCompoundByName } = require('../services/pubchemService');
const QueryHistory = require('../models/QueryHistory');

const router = express.Router();

router.post('/', protect, async (req, res, next) => {
    try {
        const { molecule, smiles, structuralMotif, searchQuery, inputType = 'name' } = req.body;
        if (!molecule && !smiles && !searchQuery) return res.status(400).json({ error: 'Molecule or search query required' });

        const moleculeName = molecule || smiles || searchQuery;
        const patentQuery = searchQuery || structuralMotif || molecule;

        // 1. Search patents using PatentsView (free USPTO)
        const patents = await searchPatentsView(patentQuery, moleculeName);

        // 2. AI analysis
        const aiResult = await analyzePatentsWithAI(moleculeName, patents, structuralMotif);
        const analysis = parseAIJson(aiResult.content);

        // Ensure AI response has required structure
        if (!analysis || analysis.raw) {
          console.error('[Patents] Invalid AI response:', aiResult.content.substring(0, 200));
          throw new Error('Failed to parse patent analysis. Please try again.');
        }

        // 3. Fetch PubChem data
        let pubchemData = null;
        try { 
          if (molecule) pubchemData = await getCompoundByName(molecule);
          if (!pubchemData) console.warn(`[Patents] PubChem data not available for: ${molecule}`);
        } catch (e) { console.error(`[Patents] PubChem lookup error: ${e.message}`); }

        const result = {
            searchQuery: patentQuery,
            molecule: moleculeName,
            patentsFound: patents.length,
            patents,
            analysis,
            pubchemData: pubchemData ? { cid: pubchemData.cid, formula: pubchemData.molecularFormula, inchiKey: pubchemData.inchiKey } : null,
            searchTimestamp: new Date().toISOString(),
            databases: ['USPTO PatentsView (Free)', 'AI Analysis (OpenRouter)'],
            note: 'Patent data from USPTO PatentsView. For comprehensive FTO, consult a patent attorney.'
        };

        await QueryHistory.create({
            userId: req.user._id,
            useCase: 'patents',
            title: `Patent Analysis: ${moleculeName}`,
            input: { molecule: moleculeName, smiles, inputType, additionalData: { structuralMotif, searchQuery } },
            output: result,
            tokensUsed: aiResult.tokens,
            model: aiResult.model
        });

        res.json({ success: true, data: result, tokensUsed: aiResult.tokens });
    } catch (err) { next(err); }
});

module.exports = router;
