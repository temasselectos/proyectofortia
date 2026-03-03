const axios = require('axios');
require('dotenv').config();

/**
 * Recuperación de contexto desde la Base de Conocimiento (BDC)
 */
async function retrieveContextFromBDC(prompt) {
    console.log(`[Lógica RAG] -> Llamando a BDC con el prompt: "${prompt}"`);

    const baseUrl = 'http://10.9.26.92:3000';
    const BDC_URL = `${baseUrl}/conocimientos`;

    try {
        const response = await axios.post(
            BDC_URL,
            { prompt: prompt },
            { timeout: 15000 }
        );

        console.log("[Lógica RAG] -> Respuesta BDC:", response.data);

        return {
            context: response.data.context || "",
            sources: response.data.sources || []
        };

    } catch (error) {
        console.error("[BDC] Error:", error.message);
        return {
            context: "",
            sources: [],
            error: "No se pudo recuperar el contexto desde la BDC"
        };
    }
}

/**
 * Generación de respuesta usando Gemini LLM
 */
async function generateWithLLM(originalPrompt, context) {
    console.log('[Lógica RAG] -> Enviando prompt con contexto a Gemini API...');

    const LLM_API_KEY = process.env.GEMINI_API_KEY;

    if (!LLM_API_KEY) {
        console.error('ERROR: GEMINI_API_KEY no está configurada');
        return 'Error: falta la API key de Gemini.';
    }

    const LLM_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${LLM_API_KEY}`;

    const systemInstruction = `Deberás ser capaz de consultar todos los tipos de documentos y fuentes de información disponibles.`;

    const payload = {
        contents: [
            {
                parts: [
                    {
                        text: `${systemInstruction}\n\nCONTEXTO:\n${context}\n\nPREGUNTA:\n${originalPrompt}`
                    }
                ]
            }
        ]
    };

    try {
        const response = await axios.post(LLM_ENDPOINT, payload, {
            headers: { "Content-Type": "application/json" },
            timeout: 30000
        });

        return response.data.candidates[0].content.parts[0].text;

    } catch (error) {
        const status = error.response?.status;
        const errorMsg = error.response?.data?.error?.message || error.message;

        console.error(`[LLM] Error (${status}):`, errorMsg);
        return `Error al generar respuesta: ${errorMsg}`;
    }
}

const QueryModule = {
    async process(prompt) {
        // 1. Recuperar contexto desde la BDC
        const bdcData = await retrieveContextFromBDC(prompt);

        // Usar contexto de la BDC si existe; si no, fallback a texto vacío
        const documents = bdcData.context
            ? [bdcData.context]
            : [
                "Albert Einstein desarrolló la teoría de la relatividad en el siglo XX.",
                "Hendrik Lorentz influyó en los conceptos matemáticos usados por Albert Einstein.",
                "La relatividad especial fue publicada en 1905.",
                "Isaac Newton propuso la mecánica clásica.",
                "Lorentz, sus transformaciones fueron clave para la relatividad."
            ];

        // 2. Llamada al LLM con el contexto recuperado
        const context = documents.join('\n');
        const llmResponse = await generateWithLLM(prompt, context);

        // 3. Regresar datos al router
        return {
            answer: llmResponse,
            contextSummary: {
                context_length: context.length,
                has_context: context.length > 0
            },
            sources: bdcData.sources || [],
            llm_raw: llmResponse
        };
    }
};

module.exports = QueryModule;
