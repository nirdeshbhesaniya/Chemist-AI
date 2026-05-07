const express = require('express');
const { protect } = require('../middleware/auth');
const { callOpenRouter, parseAIJson } = require('../services/openrouterService');
const { getCompoundByName } = require('../services/pubchemService');
const QueryHistory = require('../models/QueryHistory');

const router = express.Router();

router.post('/', protect, async (req, res, next) => {
  try {
    const { molecule, smiles, inputType = 'name', complexity = 'standard' } = req.body;
    if (!molecule && !smiles) return res.status(400).json({ error: 'Target molecule required' });

    const moleculeName = molecule || smiles;
    let pubchemData = null;
    try {
      pubchemData = await getCompoundByName(molecule);
      if (!pubchemData) console.warn(`[Retrosynthesis] PubChem data not available for: ${moleculeName}`);
    } catch (e) { console.error(`[Retrosynthesis] PubChem lookup error: ${e.message}`); }

    const prompt = `You are an expert in retrosynthesis and synthetic organic chemistry. Plan a complete retrosynthesis for the target molecule:

Target: "${moleculeName}"
${pubchemData ? `Formula: ${pubchemData.molecularFormula}, MW: ${pubchemData.molecularWeight}` : ''}
Complexity Level: ${complexity} (standard/advanced)

  Deconstruct the molecule into simpler, commercially available starting materials.
  Structure the answer as a true branching tree, not a single linear chain.
  Favor bifurcations where chemically reasonable so each node can expand into 2+ children.
  Every non-terminal node should describe one retrosynthetic disconnection and the immediate precursors that arise from it.
  Terminal leaf nodes must represent commercial starting materials only.

Respond ONLY with valid JSON:
{
  "targetMolecule": "name",
  "targetSMILES": "SMILES if known",
  "syntheticComplexity": 7,
  "numberOfSteps": 4,
  "overallYield": "estimated overall yield",
  "retrosynthesisTree": {
    "molecule": "target molecule",
    "smiles": "SMILES",
    "branchLabel": "short explanation of the branch",
    "disconnection": "type of bond disconnection (e.g., C-C, C-N, C-O)",
    "synthon": "reactive intermediate",
    "confidence": "high/medium/low",
    "transform": "retrosynthetic transform name (e.g., Claisen, Diels-Alder)",
    "children": [
      {
        "molecule": "intermediate A",
        "smiles": "SMILES",
        "isCommercial": false,
        "branchLabel": "why this intermediate is chosen",
        "disconnection": "bond type",
        "synthon": "reactive intermediate",
        "confidence": "high/medium/low",
        "transform": "transform name",
        "children": [
          {
            "molecule": "starting material 1",
            "smiles": "SMILES",
            "isCommercial": true,
            "branchLabel": "terminal commercial reagent",
            "casNumber": "CAS",
            "commercialSource": "Sigma-Aldrich / TCI / Alfa Aesar",
            "estimatedCost": "$X/g",
            "availability": "readily available"
          }
        ]
      }
    ]
  },
  "forwardSynthesis": [
    {
      "step": 1,
      "from": "starting material",
      "to": "product",
      "reagents": ["reagent 1", "reagent 2"],
      "conditions": "temperature, solvent, time",
      "reaction": "named reaction (e.g., Grignard, Wittig)",
      "yield": "X%",
      "notes": "purification, workup notes"
    }
  ],
  "startingMaterials": [
    {
      "name": "commercial chemical name",
      "casNumber": "CAS",
      "smiles": "SMILES",
      "molecularWeight": "g/mol",
      "role": "role in synthesis",
      "commercialSource": "supplier",
      "estimatedCost": "$/gram",
      "availability": "readily/specialty/custom synthesis"
    }
  ],
  "alternativeRoutes": [
    {
      "route": "Route 2: name",
      "description": "brief description",
      "advantages": ["advantage 1"],
      "disadvantages": ["disadvantage 1"],
      "steps": 5
    }
  ],
  "keyTransformations": ["Grignard reaction", "Wittig olefination"],
  "challenges": ["synthetic challenge 1", "challenge 2"],
  "recommendations": "overall synthesis recommendation"
}`;

    const aiResult = await callOpenRouter(prompt, null, true);
    const parsed = parseAIJson(aiResult.content);

    // Ensure parsed object has required structure
    if (!parsed || parsed.raw) {
      console.error('[Retrosynthesis] Invalid AI response:', aiResult.content.substring(0, 200));
      throw new Error('Failed to parse AI response. Please try again.');
    }

    // Set defaults for missing fields
    const result = {
      targetMolecule: parsed.targetMolecule || moleculeName || 'Unknown',
      targetSMILES: parsed.targetSMILES || smiles || null,
      syntheticComplexity: parsed.syntheticComplexity || 5,
      numberOfSteps: parsed.numberOfSteps || 0,
      overallYield: parsed.overallYield || 'unknown',
      retrosynthesisTree: parsed.retrosynthesisTree || { molecule: moleculeName, children: [] },
      forwardSynthesis: parsed.forwardSynthesis || [],
      keyTransformations: parsed.keyTransformations || [],
      challenges: parsed.challenges || [],
      recommendations: parsed.recommendations || 'Consult literature for detailed procedures.'
    };

    await QueryHistory.create({
      userId: req.user._id,
      useCase: 'retrosynthesis',
      title: `Retrosynthesis: ${moleculeName}`,
      input: { molecule: moleculeName, smiles, inputType, additionalData: { complexity } },
      output: result,
      tokensUsed: aiResult.tokens,
      model: aiResult.model
    });

    res.json({ success: true, data: result, pubchemData, tokensUsed: aiResult.tokens });
  } catch (err) { next(err); }
});

module.exports = router;
