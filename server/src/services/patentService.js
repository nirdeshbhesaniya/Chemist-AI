const axios = require('axios');
const { callOpenRouter } = require('./openrouterService');

/**
 * Search patents using PatentsView (free USPTO API)
 * @param {string} query - chemical name, SMILES, or structural motif
 * @param {string} molecule - molecule name for context
 */
const searchPatentsView = async (query, molecule) => {
    try {
        const payload = {
            q: { "_text_any": { "patent_abstract": query, "patent_title": query } },
            f: ["patent_id", "patent_title", "patent_abstract", "patent_date", "patent_number", "assignee_organization", "inventor_last_name"],
            o: { "per_page": 10, "sort": [{ "patent_date": "desc" }] }
        };

        const response = await axios.post(
            process.env.PATENTSVIEW_BASE_URL || 'https://api.patentsview.org/patents/query',
            payload,
            {
                headers: { 'Content-Type': 'application/json' },
                timeout: 15000
            }
        );

        const patents = response.data.patents || [];
        return patents.map(p => ({
            id: p.patent_id,
            number: p.patent_number,
            title: p.patent_title,
            abstract: p.patent_abstract,
            date: p.patent_date,
            assignee: p.assignees?.[0]?.assignee_organization || 'Unknown',
            inventors: p.inventors?.map(i => i.inventor_last_name).join(', ') || 'Unknown',
            url: `https://patents.google.com/patent/US${p.patent_number}`
        }));
    } catch (error) {
        console.error('[Patents] PatentsView error:', error.message);
        return [];
    }
};

/**
 * Use AI to analyze patents for freedom-to-operate
 */
const analyzePatentsWithAI = async (molecule, patents, structuralMotif) => {
    const patentSummaries = patents.length > 0
        ? patents.map((p, i) =>
            `${i + 1}. US${p.number} (${p.date})\nTitle: ${p.title}\nAssignee: ${p.assignee}\nAbstract: ${p.abstract?.slice(0, 300)}...`
        ).join('\n\n')
        : 'No specific patents found in USPTO database for the query.';

    const prompt = `You are a chemistry patent analyst. Analyze the following patents for freedom-to-operate (FTO) regarding the molecule/chemical: "${molecule}" ${structuralMotif ? `(Structural motif: ${structuralMotif})` : ''}.

PATENTS FOUND:
${patentSummaries}

Provide a comprehensive patent analysis in the following JSON format:
{
  "ftoSummary": "Overall freedom-to-operate assessment (1-2 sentences)",
  "riskLevel": "low|medium|high",
  "riskFactors": ["list of identified risks"],
  "keyPatents": [
    {
      "number": "patent number",
      "relevance": "why this patent is relevant",
      "expiryEstimate": "estimated expiry or unknown",
      "risk": "low|medium|high"
    }
  ],
  "recommendations": ["list of actionable recommendations"],
  "alternativeApproaches": ["patent-safe alternative synthesis routes or structures"],
  "searchKeywords": ["additional keywords to search"],
  "disclaimer": "Patent analysis disclaimer"
}`;

    return await callOpenRouter(prompt, null, true);
};

module.exports = { searchPatentsView, analyzePatentsWithAI };
