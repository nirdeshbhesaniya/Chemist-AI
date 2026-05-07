const express = require('express');
const { protect } = require('../middleware/auth');
const { callOpenRouter, parseAIJson } = require('../services/openrouterService');
const QueryHistory = require('../models/QueryHistory');

const router = express.Router();

router.post('/', protect, async (req, res, next) => {
  try {
    const { reactants, reagents = [], conditions = {}, molecule } = req.body;
    if (!reactants) return res.status(400).json({ error: 'Reactants required' });

    const condStr = Object.keys(conditions).length > 0 ? JSON.stringify(conditions) : 'standard';

    const prompt = `Predict the outcome of the following chemical reaction including yield, products, and side-products:

Reactants: "${reactants}"
Reagents: ${reagents.join(', ') || 'none specified'}
Conditions: ${condStr}
${molecule ? `Target Product: "${molecule}"` : ''}

Analyze using reaction mechanism knowledge and chemical principles.

Respond ONLY with valid JSON:
{
  "reactionSummary": "concise reaction description",
  "reactionType": "e.g., SN2 substitution, Aldol condensation",
  "reactionMechanism": "brief mechanism description",
  "mainProduct": {
    "name": "product name",
    "smiles": "SMILES",
    "casNumber": "CAS if known",
    "predictedYield": 75,
    "yieldRange": "65-85%",
    "yieldConfidence": "high/medium/low",
    "yieldFactors": ["factor 1 affecting yield", "factor 2"]
  },
  "sideProducts": [
    {
      "name": "side product name",
      "smiles": "SMILES if known",
      "estimatedAmount": "trace/minor (<5%)/moderate (5-20%)/major (>20%)",
      "percentYield": 5,
      "formationMechanism": "why this forms",
      "separability": "easy/moderate/difficult to separate"
    }
  ],
  "reactionEquation": "balanced equation: A + B → C + D",
  "stereochemistry": {
    "stereocontrol": "high/moderate/low/racemic",
    "expectedStereochemistry": "R/S, E/Z description",
    "notes": "stereochemistry notes"
  },
  "conditionSensitivity": [
    { "parameter": "temperature", "impact": "impact description", "optimal": "optimal value" }
  ],
  "competingReactions": ["competing reaction 1"],
  "workupProcedure": "recommended workup steps",
  "purificationMethod": "recommended purification",
  "purityExpected": "XX% after purification",
  "scalabilityRating": "excellent/good/moderate/poor",
  "hazards": ["hazard 1", "hazard 2"],
  "greenChemistryScore": 65,
  "wasteGenerated": ["waste stream 1"],
  "improvements": ["how to improve yield", "how to minimize side products"],
  "references": ["named reaction reference", "key paper/textbook"]
}`;

    const aiResult = await callOpenRouter(prompt, null, true);
    const parsed = parseAIJson(aiResult.content);

    // Ensure parsed object has required structure
    if (!parsed || parsed.raw) {
      console.error('[Predict] Invalid AI response:', aiResult.content.substring(0, 200));
      throw new Error('Failed to parse AI response. Please try again.');
    }

    // Set defaults for missing fields
    const result = {
      reactionSummary: parsed.reactionSummary || 'Reaction analysis pending',
      reactionType: parsed.reactionType || 'Unclassified',
      reactionMechanism: parsed.reactionMechanism || 'Mechanism analysis required',
      mainProduct: parsed.mainProduct || { name: 'Unknown', predictedYield: 0, yieldConfidence: 'low' },
      sideProducts: parsed.sideProducts || [],
      reactionEquation: parsed.reactionEquation || `${reactants} → products`,
      stereochemistry: parsed.stereochemistry || { stereocontrol: 'unknown' },
      conditionSensitivity: parsed.conditionSensitivity || [],
      competingReactions: parsed.competingReactions || [],
      workupProcedure: parsed.workupProcedure || 'Standard aqueous workup',
      purificationMethod: parsed.purificationMethod || 'Column chromatography',
      purityExpected: parsed.purityExpected || '85%',
      scalabilityRating: parsed.scalabilityRating || 'moderate',
      hazards: parsed.hazards || [],
      greenChemistryScore: parsed.greenChemistryScore || 65,
      wasteGenerated: parsed.wasteGenerated || [],
      improvements: parsed.improvements || [],
      references: parsed.references || []
    };

    await QueryHistory.create({
      userId: req.user._id,
      useCase: 'predict',
      title: `Predict: ${reactants.slice(0, 60)}`,
      input: { molecule, additionalData: { reactants, reagents, conditions } },
      output: result,
      tokensUsed: aiResult.tokens,
      model: aiResult.model
    });

    res.json({ success: true, data: result, tokensUsed: aiResult.tokens });
  } catch (err) { next(err); }
});

module.exports = router;
