const express = require('express');
const { protect } = require('../middleware/auth');
const { callOpenRouter, parseAIJson } = require('../services/openrouterService');
const { searchCompound, getCompoundByName } = require('../services/pubchemService');

const router = express.Router();

router.post('/', protect, async (req, res, next) => {
    try {
        const { chemicals } = req.body; // Array of { name, quantity, unit }
        if (!chemicals || !Array.isArray(chemicals) || chemicals.length === 0) {
            return res.status(400).json({ error: 'Array of chemical names required' });
        }

        // Enrich with PubChem data
        const enriched = await Promise.allSettled(
            chemicals.map(async (chem) => {
                try {
                    const data = await getCompoundByName(chem.name);
                    return { ...chem, pubchem: data };
                } catch {
                    return { ...chem, pubchem: null };
                }
            })
        );
        const enrichedChemicals = enriched.map(r => r.status === 'fulfilled' ? r.value : r.reason);

        // Ask AI for market price estimates
        const chemList = chemicals.map(c => `- ${c.name} (${c.quantity || '1'} ${c.unit || 'kg'})`).join('\n');
        const prompt = `Provide market price estimates for the following chemicals. Use typical bulk/lab-grade prices in USD:

${chemList}

Respond ONLY with valid JSON:
{
  "priceEstimates": [
    {
      "name": "chemical name",
      "casNumber": "CAS",
      "grade": "technical/lab/pharma",
      "pricePerKg": 25.50,
      "pricePerLiter": null,
      "currency": "USD",
      "priceTier": "bulk/lab-scale/specialty",
      "marketTrend": "stable/increasing/decreasing",
      "majorSuppliers": ["Sigma-Aldrich", "TCI", "Alfa Aesar"],
      "priceRangeMin": 20,
      "priceRangeMax": 35,
      "lastUpdatedEstimate": "2024",
      "notes": "price notes or caveats"
    }
  ],
  "totalEstimate": 0,
  "disclaimer": "Prices are AI estimates based on market knowledge. Verify with supplier quotes.",
  "pricingDate": "2024"
}`;

        const aiResult = await callOpenRouter(prompt, null, true);
        const parsed = parseAIJson(aiResult.content);

        // Ensure parsed object has required structure
        if (!parsed || parsed.raw) {
            console.error('[Pricing] Invalid AI response:', aiResult.content.substring(0, 200));
            throw new Error('Failed to parse AI response. Please try again.');
        }

        // Set defaults for missing fields
        const result = {
            priceEstimates: parsed.priceEstimates || [],
            totalEstimate: parsed.totalEstimate || 0,
            disclaimer: parsed.disclaimer || 'Prices are AI estimates. Verify with supplier quotes.',
            pricingDate: parsed.pricingDate || new Date().getFullYear().toString()
        };

        // Calculate totals with provided quantities
        if (result.priceEstimates && chemicals) {
            let total = 0;
            result.priceEstimates = result.priceEstimates.map(est => {
                const chemInput = chemicals.find(c => c.name.toLowerCase() === est.name.toLowerCase());
                if (chemInput) {
                    const qty = parseFloat(chemInput.quantity) || 1;
                    est.quantity = qty;
                    est.unit = chemInput.unit || 'kg';
                    est.subtotal = parseFloat((qty * (est.pricePerKg || est.pricePerLiter || 0)).toFixed(2));
                    total += est.subtotal;
                }
                return est;
            });
            result.totalEstimate = parseFloat(total.toFixed(2));
        }

        // Merge PubChem data
        result.pubchemData = enrichedChemicals.map(c => ({
            name: c.name,
            cid: c.pubchem?.cid,
            formula: c.pubchem?.molecularFormula,
            mw: c.pubchem?.molecularWeight,
            iupac: c.pubchem?.iupacName
        }));

        res.json({ success: true, data: result, tokensUsed: aiResult.tokens });
    } catch (err) { next(err); }
});

module.exports = router;
