let datosGuardados = null;
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

		db.run(`INSERT INTO docs (info) VALUES (?)`, [info], function (err) {
			if (err) {
				console.error("Error insertando en DB:", err.message);
				return res.status(500).json({ status: 'Error guardando en BD' });
			}

			console.log(info)
			console.log('Guardado en BD con ID:', this.lastID);

			// Response
			return res.json({
				request: 'POST',
				status: 'Guardado en BD',
				inserted_id: this.lastID,
				data_recibida: datos
			});
		}
		);
	});

	app.post('/conocimientos/', (req, res) => {
		console.log('POST')
		const { keywords, modo, k } = req.body || {};

		let kwList = [];
		kwList = keywords;

		kwList = kwList
			.map(s => String(s).trim().toLowerCase())
			.filter(Boolean);

		let K = parseInt(k, 10);
		if (!Number.isFinite(K) || K <= 0) K = 5;
		if (K > 50) K = 50;

		/*if (!datosGuardados) {
			console.log('No hay datos almacenados todavía');
			return res.json({
				status: 'No hay datos almacenados todavía'
			});
		}
		console.log('Datos almacenados:', datosGuardados);
		res.json({
			status: 'OK',
			datos: datosGuardados
		});*/
	});
}