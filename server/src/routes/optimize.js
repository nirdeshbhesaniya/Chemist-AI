const express = require('express');
const { protect } = require('../middleware/auth');
const { callOpenRouter, parseAIJson } = require('../services/openrouterService');
const QueryHistory = require('../models/QueryHistory');

const router = express.Router();

router.post('/', protect, async (req, res, next) => {
  try {
    const { molecule, reaction, currentChemicals = [], currentConditions = {}, targetYield } = req.body;
    if (!molecule && !reaction) return res.status(400).json({ error: 'Molecule or reaction required' });

    const conditionsStr = Object.keys(currentConditions).length > 0
      ? `Current conditions: ${JSON.stringify(currentConditions)}`
      : '';

    const prompt = `Optimize this reaction for better yield and green chemistry.
Target: "${molecule || 'Not specified'}"
Reaction: "${reaction || 'Not specified'}"
CurrentChemicals: ${currentChemicals.join(', ') || 'not specified'}
${conditionsStr}${targetYield ? `\nTargetYield: ${targetYield}%` : ''}

Return JSON exactly in this structure:
{
  "optimized_reaction": "CH3COOH + C2H5OH ⇌ CH3COOC2H5 + H2O",
  "alternative_chemicals": [ { "name": "...", "reason": "..." } ],
  "optimized_conditions": { "temperature": "...", "pressure": "...", "catalyst": "...", "reaction_time": "..." },
  "yield_improvement": { "current_yield": "...", "expected_yield": "..." },
  "process_improvements": [ "..." ],
  "green_chemistry_score": { "before": 0, "after": 0 },
  "by_products": [ "..." ],
  "risk_reduction": [ "..." ]
}`;

    const aiResult = await callOpenRouter(prompt, null, true);
    const parsed = parseAIJson(aiResult.content);

    // Ensure parsed object has required structure
    if (!parsed || parsed.raw) {
      console.error('[Optimize] Invalid AI response:', aiResult.content.substring(0, 200));
      throw new Error('Failed to parse AI response. Please try again.');
    }

    // Set defaults for missing fields
    const result = {
      optimized_reaction: parsed.optimized_reaction || reaction || 'Optimization pending',
      alternative_chemicals: parsed.alternative_chemicals || [],
      optimized_conditions: parsed.optimized_conditions || { temperature: 'standard', pressure: '1 atm', catalyst: 'none', reaction_time: '24h' },
      yield_improvement: parsed.yield_improvement || { current_yield: 'baseline', expected_yield: 'improved' },
      process_improvements: parsed.process_improvements || [],
      green_chemistry_score: parsed.green_chemistry_score || { before: 50, after: 75 },
      by_products: parsed.by_products || [],
      risk_reduction: parsed.risk_reduction || []
    };

    await QueryHistory.create({
      userId: req.user._id,
      useCase: 'optimize',
      title: `Optimize: ${molecule || reaction?.slice(0, 50)}`,
      input: { molecule, additionalData: { reaction, currentChemicals, currentConditions, targetYield } },
      output: result,
      tokensUsed: aiResult.tokens,
      model: aiResult.model
    });

    res.json({ success: true, data: result, tokensUsed: aiResult.tokens });
  } catch (err) { next(err); }
});

module.exports = router;
