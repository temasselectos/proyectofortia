let datosGuardados = null;
module.exports = function(app){
  // Rutas para RAG
  app.post('/extraccion/', (req, res) => {
    console.log('POST')
    const datos = req.body;
    if (datosGuardados == null || datosGuardados == "") {
      return res.json({
        status: 'No se recibieron datos'
      });
    } else {
      datosGuardados = datos
      console.log(datos);
    }
    res.json({
      request: 'POST',
      data_recibida: req.body
    });
  });

  app.post('/conocimientos/', (req, res) => {
    console.log('POST')
    if (!datosGuardados) {
      console.log('No hay datos almacenados todavía');
      return res.json({
        status: 'No hay datos almacenados todavía'
      });
    }
    console.log('Datos almacenados:', datosGuardados);
    res.json({
      status: 'OK',
      datos: datosGuardados
    });
  });
}