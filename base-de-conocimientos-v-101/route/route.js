const { franc } = require('franc-min');
const langs = require('langs');

// Regex simples (sirven bien como filtros)
const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const URL_RE = /\b((https?:\/\/)|www\.)[^\s<>"']+/i;

function detectLang(text) {
	const cleaned = (text || '').replace(/\s+/g, ' ').trim();
	if (cleaned.length < 40) return 'unknown';

	const iso3 = franc(cleaned, { minLength: 40 }); // ej: 'spa', 'eng', o 'und'
	if (!iso3 || iso3 === 'und') return 'unknown';

	const obj = langs.where('3', iso3);
	return (obj && obj['1']) ? obj['1'] : iso3; // 'es'/'en' si se puede, si no ISO3
}

module.exports = function (app, db) {
	// Rutas para RAG
	app.post('/extraccion/', (req, res) => {
		console.log('POST')
		const datos = req.body;

		// Validación 
		if (!datos || (typeof datos === 'object' && Object.keys(datos).length === 0)) {
			return res.json({ status: 'No se recibieron datos' });
		}

		const info = JSON.stringify(datos);
		const text = info;

		const metas = [
			{ key: 'ingested_at', value: new Date().toISOString() },
			{ key: 'lang', value: detectLang(text) },
			{ key: 'has_email', value: EMAIL_RE.test(text) ? '1' : '0' },
			{ key: 'has_url', value: URL_RE.test(text) ? '1' : '0' },
		];

		db.serialize(() => {
			db.run('BEGIN TRANSACTION');

			db.run(`INSERT INTO docs (info) VALUES (?)`, [info], function (err) {
				if (err) {
					db.run('ROLLBACK');
					return res.status(500).json({ status: 'Error guardando en la BD:', error: err.message });
				}
				const docId = this.lastID;

				const stmt = db.prepare(`INSERT INTO doc_meta (doc_id, key, value) VALUES (?, ?, ?)`);
				for (const m of metas) {
					stmt.run([docId, m.key, m.value], (e) => {
						if (e) { console.error('Error meta:', e.message); }
					});
				}

				stmt.finalize((errFinalize) => {
					if (errFinalize) {
						db.run('ROLLBACK');
						return res.status(500).json({ status: 'Error guardando metadatos', error: errFinalize.message });
					}

					db.run('COMMIT', (errCommit) => {
						if (errCommit) {
							db.run('ROLLBACK');
							return res.status(500).json({ status: 'Error confirmando', error: errCommit.message });
						}

						return res.json({
							status: 'Guardado doc + metadatos',
							inserted_id: docId,
							metadatos: Object.fromEntries(metas.map(m => [m.key, m.value])),
						});
					});
				});
			});
		});
	});

	app.post('/conocimientos/', (req, res) => {
		console.log('POST')
		const { keywords, modo, k } = req.body || {};

		let kwList = Array.isArray(keywords) ? keywords : [];
		kwList = kwList
			.map(x => String(x).trim())
			.filter(Boolean);

		if (kwList.length > 20) kwList = kwList.slice(0, 20);

		if (kwList.length === 0) {
			return res.status(400).json({
				status: 'No se recibieron keywords válidas',
				ejemplo: { keywords: ['python', 'sql'], modo: 'estricto', k: 5 }
			});
		}

		let K = parseInt(k, 10);
		if (!Number.isFinite(K) || K <= 0) K = 5;
		if (K > 50) K = 50;

		const escapeLike = (s) =>
			s.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
		const patterns = kwList.map(w => `%${escapeLike(w)}%`);

		const whereParts = patterns
			.map(() => `d.info LIKE ? ESCAPE '\\' COLLATE NOCASE`)
			.join(joiner);

		// SCORE: cuántas keywords matchearon (para ordenar top K)
		const scoreExpr = patterns
			.map(() => `CASE WHEN d.info LIKE ? ESCAPE '\\' COLLATE NOCASE THEN 1 ELSE 0 END`)
			.join(' + ');

		const sql = `
    SELECT d.id, d.info,
           (${scoreExpr}) AS score
    FROM docs d
    WHERE ${whereParts}
    ORDER BY score DESC, d.id DESC
    LIMIT ?;
  `;

		// OJO: los placeholders del score van primero (scoreExpr), luego los del WHERE, luego LIMIT
		const params = [...patterns, ...patterns, K];

		db.all(sql, params, (err, rows) => {
			if (err) {
				console.error('Error en consulta:', err.message);
				return res.status(500).json({ status: 'Error en consulta', error: err.message });
			}

			const resultados = rows.map(r => {
				let parsed = r.info;
				try { parsed = JSON.parse(r.info); } catch { }
				return { id: r.id, score: r.score, info: parsed };
			});

			return res.json({
				status: 'OK',
				modo: strict ? 'estricto' : 'flexible',
				k: K,
				keywords: kwList,
				encontrados: resultados.length,
				resultados
			});
		});
	});
}