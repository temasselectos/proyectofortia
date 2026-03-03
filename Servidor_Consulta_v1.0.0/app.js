var express = require('express');
var app = express();
require('dotenv').config(); 

app.use(express.json()); 
require('./route/QueryRoutes')(app);

async function startServer() {
    const PORT = process.env.PORT
    
    app.listen(PORT, async () => {
        console.log(`Servidor escuchando en el puerto ${PORT}`);
    });
}

startServer();



