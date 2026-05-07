const axios = require('axios');

const OPENROUTER_BASE = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
const MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';

// JSON-first system prompt (all current routes use JSON mode)
const CHEMISTRY_SYSTEM_PROMPT = `You are ChemistAI, an expert computational and synthetic chemist.
Return ONLY valid JSON with the exact keys requested.
Do not include markdown, code fences, or extra commentary.
Use realistic chemistry with appropriate units (kg, L, mol, °C, g/mol) and reasonable industrial conditions.
If a field is requested but unknown, provide the best plausible estimate instead of leaving it empty.`;

/**
 * Call OpenRouter API
 */
const callOpenRouter = async (userPrompt, systemOverride = null, jsonMode = false) => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        throw new Error('OpenRouter API key not configured. Please add OPENROUTER_API_KEY to your .env file.');
    }

    const payload = {
        model: MODEL,
        messages: [
            { role: 'system', content: systemOverride || CHEMISTRY_SYSTEM_PROMPT },
            { role: 'user', content: userPrompt }
        ],
        temperature: 0.2,
        max_tokens: 3500,
        ...(jsonMode && { response_format: { type: 'json_object' } })
    };

    try {
        const response = await axios.post(
            `${OPENROUTER_BASE}/chat/completions`,
            payload,
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'http://localhost:5173',
                    'X-Title': 'Chemist AI Portal'
                },
                timeout: 90000
            }
        );

        const choice = response.data.choices?.[0];
        if (!choice) throw new Error('No response from AI model');

        return {
            content: choice.message.content,
            tokens: response.data.usage?.total_tokens || 0,
            model: response.data.model || MODEL
        };
    } catch (error) {
        if (error.response) {
            const msg = error.response.data?.error?.message || error.response.statusText;
            throw new Error(`OpenRouter API error (${error.response.status}): ${msg}`);
        }
        throw error;
    }
};

/**
 * Strip markdown code fences and parse JSON
 */
const parseAIJson = (content) => {
    const cleaned = String(content || '')
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

    // Try direct parse first
    try { return JSON.parse(cleaned); } catch (e) {
        // Attempt to extract the largest {...} block
        try {
            const first = cleaned.indexOf('{');
            const last = cleaned.lastIndexOf('}');
            if (first !== -1 && last !== -1 && last > first) {
                const sub = cleaned.substring(first, last + 1);
                try { return JSON.parse(sub); } catch (e2) { /* fallthrough */ }
            }
        } catch (e3) { /* ignore */ }

        // Fallback: try regex match for any JSON-looking object
        try {
            const m = cleaned.match(/\{[\s\S]*\}/m);
            if (m && m[0]) {
                try { return JSON.parse(m[0]); } catch (e4) { /* fallthrough */ }
            }
        } catch (e5) { /* ignore */ }

        return { raw: content };
    }
};

module.exports = { callOpenRouter, parseAIJson, CHEMISTRY_SYSTEM_PROMPT };
