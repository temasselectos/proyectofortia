// Importa el módulo que contiene la lógica para procesar las consultas RAG
const ragModule = require('../modules/QueryModule');

// Exporta una función que recibe la instancia de la aplicación Express ('app')
module.exports = function(app) {
      // Define una ruta POST en el endpoint '/rag/query'
    app.post('/rag/query', async (req, res) => {
        
        // Extrae la propiedad 'prompt' del cuerpo de la petición (usa encadenamiento opcional)
        const prompt = req.body?.prompt;

        // Validación: Si no hay prompt, responde con error 400 (Bad Request)
        if (!prompt) {
            return res.status(400).json({
                error: "El cuerpo de la petición debe contener el campo 'prompt'."
            });
        }

        // Registro en consola para depuración técnica
        console.log(`[Router] Prompt recibido: "${prompt}"`);

        try {
            // Llama a la función 'process' del módulo RAG de forma asíncrona
            const result = await ragModule.process(prompt);

            // Si todo sale bien, devuelve la respuesta y metadatos con status 200 (OK)
            res.status(200).json({
                respuesta: result.answer,           // El texto generado por la IA
                contexto_usado: result.contextSummary, // Resumen de los documentos encontrados
                fuentes: result.sources,            // Origen de la información (PDFs, links, etc.)
                llm_raw: result.llm_raw             // Respuesta cruda del modelo de lenguaje
            });

        } catch (error) {
            // En caso de fallo en el pipeline, imprime el error y avisa al cliente
            console.error("Error en el pipeline RAG:", error);
            res.status(500).json({
                error: "Error interno al procesar la consulta RAG."
            });
        }
    });
 app.get('/rag/query', async (req, res) => {
        
        // Extrae la propiedad 'prompt' del cuerpo de la petición (usa encadenamiento opcional)
        const prompt = req.body?.prompt;

        // Validación: Si no hay prompt, responde con error 400 (Bad Request)
        if (!prompt) {
            return res.status(400).json({
                error: "El cuerpo de la petición debe contener el campo 'prompt'."
            });
        }

        // Registro en consola para depuración técnica
        console.log(`[Router] Prompt recibido: "${prompt}"`);

        try {
            // Llama a la función 'process' del módulo RAG de forma asíncrona
            const result = await ragModule.process(prompt);

            // Si todo sale bien, devuelve la respuesta y metadatos con status 200 (OK)
            res.status(200).json({
                respuesta: result.answer,           // El texto generado por la IA
                contexto_usado: result.contextSummary, // Resumen de los documentos encontrados
                fuentes: result.sources,            // Origen de la información (PDFs, links, etc.)
                llm_raw: result.llm_raw             // Respuesta cruda del modelo de lenguaje
            });

        } catch (error) {
            // En caso de fallo en el pipeline, imprime el error y avisa al cliente
            console.error("Error en el pipeline RAG:", error);
            res.status(500).json({
                error: "Error interno al procesar la consulta RAG."
            });
        }
    });

    // Endpoint de salud para verificar conectividad
    app.get('/health', (req, res) => {
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            service: 'query-module-rag',
            local_url: 'http://localhost:8000'
        });
    });
  
};

