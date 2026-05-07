const express = require('express');
const { protect } = require('../middleware/auth');
const { callOpenRouter, parseAIJson } = require('../services/openrouterService');
const { getCompoundByName, getCompoundBySmiles } = require('../services/pubchemService');
const QueryHistory = require('../models/QueryHistory');

const router = express.Router();

router.post('/', protect, async (req, res, next) => {
  try {
    const { molecule, smiles, inputType = 'name', chemicalPrices = {} } = req.body;
    if (!molecule && !smiles) return res.status(400).json({ error: 'Molecule name or SMILES required' });

    const moleculeName = (molecule || smiles || '').trim();
    let pubchemData = null;
    try {
      pubchemData = inputType === 'smiles'
        ? await getCompoundBySmiles(smiles)
        : await getCompoundByName(molecule);
      if (!pubchemData) console.warn(`[Manufacturing] PubChem data not available for: ${moleculeName}`);
    } catch (e) { console.error(`[Manufacturing] PubChem lookup error: ${e.message}`); }

    const pubchemContext = pubchemData
      ? `\nPubChem Data: Formula=${pubchemData.molecularFormula}, MW=${pubchemData.molecularWeight}, IUPAC=${pubchemData.iupacName}`
      : '';

    const priceContext = Object.keys(chemicalPrices).length > 0
      ? `\nProvided Chemical Prices (USD/kg): ${JSON.stringify(chemicalPrices)}`
      : '';

    const prompt = `INDUSTRIAL GREEN CHEMISTRY MANUFACTURING PROCESS PLAN for "${moleculeName}"
${pubchemContext}${priceContext}

Generate a COMPREHENSIVE production process with INDUSTRY-LEVEL detail:

Return JSON with these complete sections:

=== BASICS ===
- targetMolecule, casNumber, molecularFormula, overview (1-2 sentences), greenChemistryScore (0-100)
- molecularWeight, iupacName

=== GREEN PRINCIPLES ===
- greenPrinciples: string[] (Atom economy, E-factor minimization, waste reduction, safer solvents, etc.)

=== SYNTHESIS STEPS ===
- steps: [{
    stepNumber, title, description, reaction (balanced equation),
    conditions: {temperature, pressure, solvent, time, catalyst},
    yield (percent), byproducts: [{name, amount}]
  }] — max 6 steps, realistic procedures

=== CHEMICALS & CONSUMPTION ===
- chemicals: [{
    name, casNumber, role (reagent/solvent/catalyst),
    quantity, unit, consumptionNorm (kg/kg_product),
    estimatedPricePerKg, isGreen (true/false)
  }] — include all materials

=== COSTS & ECONOMICS ===
- totalMaterialCost, costPerKgProduct, costBreakdownNotes

=== WASTE & ENVIRONMENT ===
- wasteGenerated: [list of waste streams],
- wasteMinimizationStrategy (concise action plan),
- environmentalImpactNotes

=== PROCESS SAFETY ===
- safetyConsiderations: string[] (hazards, precautions, PPE)

=== OPTIMIZATION ===
- improvements: [list of practical yield/efficiency/cost optimizations],
- alternativeRoutes: [{name, description, yield, advantage}] (2-3 alternatives)

=== PRODUCTION SCALE ===
- scalabilityRating (excellent/good/moderate/poor),
- scalabilityNotes (challenges at scale, equipment needed),
- qualityControlCheckpoints: [step-by-step QC procedures]

=== COMPLIANCE ===
- regulatoryCompliance (EPA/OSHA/GHS considerations)

Be realistic. Apply green chemistry principles. Include costs and waste streams.

IMPORTANT CONSTRAINTS:
- Do NOT return an empty object (e.g. {}).
- Do NOT leave sections empty: include at least 4 steps and at least 6 chemicals.
- greenPrinciples must have at least 6 items.
- wasteGenerated must have at least 3 items.
- safetyConsiderations must have at least 4 items.
- If exact CAS/IUPAC are unknown, set them to null, but still populate the process content.`;

    const isMeaningful = (obj) => {
      if (!obj || typeof obj !== 'object') return false;
      const overviewOk = typeof obj.overview === 'string' && obj.overview.trim().length >= 20;
      const stepsOk = Array.isArray(obj.steps) && obj.steps.length >= 2;
      const chemsOk = Array.isArray(obj.chemicals) && obj.chemicals.length >= 2;
      const greenOk = Array.isArray(obj.greenPrinciples) && obj.greenPrinciples.length >= 2;
      return overviewOk && stepsOk && chemsOk && greenOk;
    };

    const normalizeManufacturingResponse = (parsedResponse) => {
      const source = parsedResponse && typeof parsedResponse === 'object' ? parsedResponse : {};
      const basics = source.BASICS || source.basics || {};
      const greenPrinciplesSection = source['GREEN PRINCIPLES'] || source.greenPrinciplesSection || {};
      const synthesisSection = source['SYNTHESIS STEPS'] || source.synthesisStepsSection || {};
      const chemicalsSection = source['CHEMICALS & CONSUMPTION'] || source.chemicalsSection || {};
      const costsSection = source['COSTS & ECONOMICS'] || source.costsSection || {};
      const wasteSection = source['WASTE & ENVIRONMENT'] || source.wasteSection || {};
      const safetySection = source['PROCESS SAFETY'] || source.safetySection || {};
      const optimizationSection = source['OPTIMIZATION'] || source.optimizationSection || {};
      const scaleSection = source['PRODUCTION SCALE'] || source.scaleSection || {};
      const complianceSection = source['COMPLIANCE'] || source.complianceSection || {};

      return {
        ...source,
        targetMolecule: source.targetMolecule || basics.targetMolecule || null,
        casNumber: source.casNumber || basics.casNumber || null,
        molecularFormula: source.molecularFormula || basics.molecularFormula || null,
        overview: source.overview || basics.overview || null,
        greenChemistryScore: source.greenChemistryScore ?? basics.greenChemistryScore ?? null,
        iupacName: source.iupacName || basics.iupacName || null,
        molecularWeight: source.molecularWeight || basics.molecularWeight || null,
        greenPrinciples: source.greenPrinciples || greenPrinciplesSection.greenPrinciples || [],
        steps: source.steps || synthesisSection.steps || [],
        chemicals: source.chemicals || chemicalsSection.chemicals || [],
        totalMaterialCost: source.totalMaterialCost ?? costsSection.totalMaterialCost ?? 0,
        costPerKgProduct: source.costPerKgProduct ?? costsSection.costPerKgProduct ?? 0,
        costBreakdownNotes: source.costBreakdownNotes || costsSection.costBreakdownNotes || null,
        wasteGenerated: source.wasteGenerated || wasteSection.wasteGenerated || [],
        wasteMinimizationStrategy: source.wasteMinimizationStrategy || wasteSection.wasteMinimizationStrategy || null,
        environmentalImpactNotes: source.environmentalImpactNotes || wasteSection.environmentalImpactNotes || null,
        safetyConsiderations: source.safetyConsiderations || safetySection.safetyConsiderations || [],
        improvements: source.improvements || optimizationSection.improvements || [],
        alternativeRoutes: source.alternativeRoutes || optimizationSection.alternativeRoutes || [],
        scalabilityRating: source.scalabilityRating || scaleSection.scalabilityRating || null,
        scalabilityNotes: source.scalabilityNotes || scaleSection.scalabilityNotes || null,
        qualityControlCheckpoints: source.qualityControlCheckpoints || scaleSection.qualityControlCheckpoints || [],
        regulatoryCompliance: source.regulatoryCompliance || complianceSection.regulatoryCompliance || null
      };
    };

    const runAIOnce = async (p) => {
      const aiResult = await callOpenRouter(p, null, true);
      const parsed = parseAIJson(aiResult.content);
      return { aiResult, parsed };
    };

    let { aiResult, parsed } = await runAIOnce(prompt);

    // Ensure parsed object has required structure for frontend
    if (!parsed || parsed.raw) {
      console.error('[Manufacturing] Invalid AI response:', aiResult.content.substring(0, 200));
      throw new Error('Failed to parse AI response. Please try again.');
    }

    parsed = normalizeManufacturingResponse(parsed);

    // Retry once if the model returned a valid-but-empty JSON object
    if (!isMeaningful(parsed)) {
      const retryPrompt = `${prompt}

Your previous JSON was incomplete/empty. Regenerate and fully populate ALL required sections with realistic content. Do not return empty arrays.`;
      const retry = await runAIOnce(retryPrompt);
      aiResult = retry.aiResult;
      parsed = normalizeManufacturingResponse(retry.parsed);

      if (!parsed || parsed.raw || !isMeaningful(parsed)) {
        // Attempt graceful fallback: extract overview and green score heuristically
        const raw = String(aiResult?.content || '');
        console.error('[Manufacturing] Incomplete AI response after retry:', raw.substring(0, 400));

        const overviewMatch = raw.match(/"overview"\s*:\s*"([\s\S]*?)"/i);
        const scoreMatch = raw.match(/"green(?:Chemistry)?Score"\s*:\s*([0-9]+(?:\.[0-9]+)?)/i);
        const fallbackOverview = overviewMatch ? overviewMatch[1].replace(/\\n/g, ' ').trim() : parsed.overview || 'AI-generated green chemistry synthesis route.';
        const fallbackScore = scoreMatch ? Number.parseFloat(scoreMatch[1]) : parsed.greenChemistryScore ?? 70;

        const minimal = {
          targetMolecule: parsed.targetMolecule || moleculeName || 'Unknown',
          overview: fallbackOverview,
          greenChemistryScore: Number.isFinite(fallbackScore) ? fallbackScore : 70,
          steps: Array.isArray(parsed.steps) ? parsed.steps : [],
          chemicals: Array.isArray(parsed.chemicals) ? parsed.chemicals : []
        };

        // Save minimal output to history and return a partial response instead of failing
        try {
          await QueryHistory.create({
            userId: req.user._id,
            useCase: 'manufacturing',
            title: `Manufacturing (partial): ${moleculeName}`,
            input: { molecule: moleculeName, smiles, inputType, additionalData: { chemicalPrices } },
            output: minimal,
            tokensUsed: aiResult.tokens,
            model: aiResult.model
          });
        } catch (e) {
          console.error('[Manufacturing] Failed to save partial history:', e.message);
        }

        return res.json({ success: true, data: minimal, pubchemData, tokensUsed: aiResult.tokens, warning: 'AI response incomplete; returned minimal overview + score' });
      }
    }

    // Set defaults for missing fields to ensure frontend displays something
    const result = {
      targetMolecule: (parsed.targetMolecule || molecule || 'Unknown').trim(),
      casNumber: parsed.casNumber || null,
      molecularFormula: parsed.molecularFormula || pubchemData?.molecularFormula || null,
      overview: parsed.overview || 'AI-generated green chemistry synthesis route.',
      greenChemistryScore: parsed.greenChemistryScore ?? 70,
      iupacName: parsed.iupacName || null,
      molecularWeight: parsed.molecularWeight || pubchemData?.molecularWeight || null,
      greenPrinciples: parsed.greenPrinciples || [],
      steps: parsed.steps || [],
      chemicals: parsed.chemicals || [],
      totalMaterialCost: parsed.totalMaterialCost ?? 0,
      costPerKgProduct: parsed.costPerKgProduct ?? 0,
      costBreakdownNotes: parsed.costBreakdownNotes || null,
      wasteGenerated: parsed.wasteGenerated || [],
      wasteMinimizationStrategy: parsed.wasteMinimizationStrategy || null,
      environmentalImpactNotes: parsed.environmentalImpactNotes || null,
      safetyConsiderations: parsed.safetyConsiderations || [],
      improvements: parsed.improvements || [],
      alternativeRoutes: parsed.alternativeRoutes || [],
      scalabilityRating: parsed.scalabilityRating || null,
      scalabilityNotes: parsed.scalabilityNotes || null,
      qualityControlCheckpoints: parsed.qualityControlCheckpoints || [],
      regulatoryCompliance: parsed.regulatoryCompliance || null
    };
    if (Object.keys(chemicalPrices).length > 0 && result.chemicals) {
      result.chemicals = result.chemicals.map(chem => {
        const priceKey = Object.keys(chemicalPrices).find(k =>
          k.toLowerCase().includes(chem.name.toLowerCase()) ||
          chem.name.toLowerCase().includes(k.toLowerCase())
        );
        if (priceKey) chem.estimatedPricePerKg = chemicalPrices[priceKey];
        return chem;
      });
      result.totalMaterialCost = result.chemicals.reduce((acc, c) => {
        const qty = parseFloat(c.quantity) || 0;
        return acc + (qty * (c.estimatedPricePerKg || 0));
      }, 0);
    }

    // Save to history
    await QueryHistory.create({
      userId: req.user._id,
      useCase: 'manufacturing',
      title: `Manufacturing: ${moleculeName}`,
      input: { molecule: moleculeName, smiles, inputType, additionalData: { chemicalPrices } },
      output: result,
      tokensUsed: aiResult.tokens,
      model: aiResult.model
    });

    res.json({ success: true, data: result, pubchemData, tokensUsed: aiResult.tokens });
  } catch (err) { next(err); }
});

module.exports = router;
