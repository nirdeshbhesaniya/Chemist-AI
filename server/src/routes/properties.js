const express = require('express');
const { protect } = require('../middleware/auth');
const { callOpenRouter, parseAIJson } = require('../services/openrouterService');
const { getCompoundByName, getCompoundBySmiles } = require('../services/pubchemService');
const QueryHistory = require('../models/QueryHistory');

const router = express.Router();

router.post('/', protect, async (req, res, next) => {
  try {
    const { molecule, smiles, inputType = 'name' } = req.body;
    if (!molecule && !smiles) return res.status(400).json({ error: 'Molecule name or SMILES required' });

    const moleculeName = molecule || smiles;
    let pubchemData = null;
    try {
      pubchemData = inputType === 'smiles'
        ? await getCompoundBySmiles(smiles)
        : await getCompoundByName(molecule);
      if (!pubchemData) console.warn(`[Properties] PubChem data not available for: ${moleculeName}`);
    } catch (e) { console.error(`[Properties] PubChem lookup error: ${e.message}`); }

    const pubchemContext = pubchemData
      ? `Known data from PubChem: Formula=${pubchemData.molecularFormula}, MW=${pubchemData.molecularWeight}g/mol, SMILES=${pubchemData.smiles}, XLogP=${pubchemData.xlogp}, TPSA=${pubchemData.tpsa}`
      : '';

    const prompt = `Predict comprehensive physicochemical and toxicological properties for INDUSTRY-LEVEL analysis: "${moleculeName}"
${pubchemContext}

Return JSON (be concise, use null for unknowns). Include INDUSTRY context:

=== IDENTIFICATION ===
- molecule, casNumber, molecularFormula, molecularWeight, smiles, confidenceOverall
- iupacName, commonNames: []

=== PHYSICAL PROPERTIES (with uncertainty ranges) ===
- physicalProperties: {
    boilingPoint: {value, unit: "°C", min, max, confidence},
    meltingPoint: {value, unit: "°C", min, max, confidence},
    density: {value, unit: "g/cm³", min, max, confidence},
    vaporPressure: {value, unit: "mmHg @ 25°C", min, max, confidence},
    flashPoint: {value, unit: "°C", min, max, confidence},
    surfaceTension: {value, unit: "dyn/cm", confidence}
  }

=== SOLUBILITY PROFILE ===
- solubility: {
    waterSolubility: {value, unit: "g/L", classification, logS, confidence},
    organicSolvents: {ethanol, acetone, DMSO, chloroform, dichloromethane},
    pH_dependent: "yes/no if relevant"
  }

=== TOXICOLOGY & HAZARD (GHS COMPLIANT) ===
- toxicology: {
    acuteToxicity: {oralLD50: {value, unit: "mg/kg", classification}, inhalation, dermal},
    carcinogenicity: "not classified|suspected|category 1A|category 1B",
    mutagenicity: "yes|no|suspected",
    reproductiveToxicity: "yes|no|suspected",
    skinSensitization: "yes|no",
    organisticToxicity: "yes|no",
    ghsHazardCodes: ["H-statement codes"],
    signalWord: "Danger|Warning",
    hazardWarnings: ["concise safety warnings"]
  }

=== ADME / DRUG-LIKENESS ===
- adme: {
    lipinskiRuleOf5: {pass: true/false, violations: []},
    logP: {value, confidence},
    hbondDonors: {value, ideal_range: "0-5"},
    hbondAcceptors: {value, ideal_range: "0-10"},
    bioavailabilityScore: "high|moderate|low",
    bloodBrainBarrier: "permeable|nonpermeable",
    halfLife: {value, unit: "hours", confidence},
    proteinBinding: "high|moderate|low"
  }

=== REGULATORY & COMPLIANCE ===
- regulatory: {
    epaStatus: "not listed|listed|restricted|banned",
    reachRegistration: "registered|not required|pending",
    clpClassification: ["H-statements with categories"],
    useFDA: "GRAS|approved|restricted|not approved",
    industryApplications: ["pharmaceuticals", "agrochemicals", "cosmetics", "food additive", etc],
    safetyGrade: "Class I (safest)|Class II|Class III|Class IV (hazardous)"
  }

=== STABILITY & HANDLING ===
- stability: {
    thermalStability: "stable|moderate|unstable with temp ranges",
    lightSensitivity: "not sensitive|light sensitive|very sensitive",
    moistureSensitivity: "not sensitive|moisture sensitive",
    storageCondition: "room temp|refrigerated|inert atmosphere",
    shelfLife: "value in months/years",
    incompatibilities: ["list of incompatible materials"]
  }

=== ELECTRICAL & SPECIAL PROPERTIES ===
- advancedProperties: {
    conductivity: {value, unit: "S/cm"},
    dipoleMoment: {value, unit: "Debye"},
    pKa: {value, confidence},
    opticalProperties: "description if applicable",
    commercialAvailability: "readily available|limited|rare"
  }

=== INDUSTRIAL RECOMMENDATIONS ===
- industrialContext: {
    suitability: ["textile manufacturing", "pharmaceutical synthesis", "research only", etc],
    preferredVendors: "if commonly available",
    alternativesIfHazardous: [{name: "compound name", reason: "safer|better performance"}],
    costIndicator: "low|medium|high",
    scalability: "lab scale suitable|pilot scale|industrial scale",
    yieldOptimization: "temperature/pressure conditions for synthesis"
  }

- disclaimer: "AI prediction based on chemical structure and known data. Verify all properties experimentally before industrial/pharmaceutical use. Always consult current MSDS and regulatory guidelines."`;

    const aiResult = await callOpenRouter(prompt, null, true);
    const parsed = parseAIJson(aiResult.content);

    // Ensure parsed object has required structure
    if (!parsed || parsed.raw) {
      console.error('[Properties] Invalid AI response:', aiResult.content.substring(0, 200));
      throw new Error('Failed to parse AI response. Please try again.');
    }

    // Set defaults for missing fields
    const result = {
      molecule: parsed.molecule || moleculeName || 'Unknown',
      casNumber: parsed.casNumber || null,
      molecularFormula: parsed.molecularFormula || null,
      molecularWeight: parsed.molecularWeight || null,
      smiles: parsed.smiles || null,
      iupacName: parsed.iupacName || null,
      commonNames: parsed.commonNames || [],
      confidenceOverall: parsed.confidenceOverall || 'medium',
      physicalProperties: parsed.physicalProperties || {},
      solubility: parsed.solubility || {},
      toxicology: parsed.toxicology || {},
      adme: parsed.adme || {},
      advancedProperties: parsed.advancedProperties || {},
      stability: parsed.stability || {},
      regulatory: parsed.regulatory || {},
      industrialContext: parsed.industrialContext || {},
      disclaimer: parsed.disclaimer || 'AI prediction — verify experimentally.'
    };

    // Merge PubChem real data
    if (pubchemData) {
      result.pubchemVerified = {
        cid: pubchemData.cid,
        molecularFormula: pubchemData.molecularFormula,
        molecularWeight: pubchemData.molecularWeight,
        xlogp: pubchemData.xlogp,
        tpsa: pubchemData.tpsa,
        smiles: pubchemData.smiles,
        iupacName: pubchemData.iupacName
      };
    }

    await QueryHistory.create({
      userId: req.user._id,
      useCase: 'properties',
      title: `Properties: ${moleculeName}`,
      input: { molecule: moleculeName, smiles, inputType },
      output: result,
      tokensUsed: aiResult.tokens,
      model: aiResult.model
    });

    res.json({ success: true, data: result, pubchemData, tokensUsed: aiResult.tokens });
  } catch (err) { next(err); }
});

module.exports = router;
