const express = require('express');
const fs = require('fs');
const XLSX = require('xlsx');
const path = require('path');

const app = express();
const port = 3000;

// Middleware para manejar solicitudes JSON
app.use(express.json());
app.use(express.static('public')); // Para servir archivos estáticos (como HTML, JS)

app.post('/actualizar-estadisticas', (req, res) => {
    const { medidaBuscada } = req.body;

    if (!medidaBuscada) {
        return res.status(400).json({ error: 'Medida no proporcionada' });
    }

    // Ruta del archivo Excel en el servidor
    const filePath = path.join(__dirname, 'files', 'TOPMEDIDAS.xlsx');

    // Leer el archivo Excel
    const workbook = XLSX.readFile(filePath);
    const worksheet = workbook.Sheets['Hoja1'];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    // Buscar la medida en los datos del archivo
    let medidaExistente = jsonData.find(row => row['MEDIDA'] && row['MEDIDA'].toString().toUpperCase() === medidaBuscada.toUpperCase());

    if (medidaExistente) {
        // Si la medida ya existe, incrementar la cantidad
        medidaExistente['CANTIDAD'] = medidaExistente['CANTIDAD'] ? medidaExistente['CANTIDAD'] + 1 : 1;
    } else {
        // Si la medida no existe, agregarla con cantidad 1
        jsonData.push({ 'MEDIDA': medidaBuscada, 'CANTIDAD': 1 });
    }

    // Convertir los datos modificados de nuevo al formato Excel
    const newWorksheet = XLSX.utils.json_to_sheet(jsonData);
    workbook.Sheets['Hoja1'] = newWorksheet;

    // Guardar el archivo Excel actualizado
    XLSX.writeFile(workbook, filePath);

    res.status(200).json({ message: 'Estadísticas actualizadas correctamente' });
});

app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});
