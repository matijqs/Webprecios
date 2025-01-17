const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));  // Para servir los archivos estáticos

let estadisticas = {};

app.post('/actualizar-estadisticas', (req, res) => {
    const medidaBuscada = req.body.medidaBuscada;
    if (estadisticas[medidaBuscada]) {
        estadisticas[medidaBuscada]++;
    } else {
        estadisticas[medidaBuscada] = 1;
    }

    res.json({ message: 'Estadísticas actualizadas' });
});

app.get('/get-top-busquedas', (req, res) => {
    const topBusquedas = Object.entries(estadisticas)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    res.json({ topBusquedas });
});

app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
