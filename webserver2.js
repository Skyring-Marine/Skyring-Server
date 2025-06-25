const express = require('express');
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
const { exec } = require('child_process');
const multer = require('multer');
const fetch = require('node-fetch');

const hostname = '172.31.39.213';
const port = 3000;
const url = 'mongodb://127.0.0.1:27017';
const dbName = 'myproject';
let db;

const carpeta = '/home/ubuntu/Skyring-Server/transferencia2';
const carpeta2 = '/home/ubuntu/Skyring-Server/uploads';

const app = express();

// ==============================
// Configuración de Multer
// ==============================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage });

// ==============================
// Rutas Express
// ==============================

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'Cover Template for Bootstrap.html'));
});

app.get('/crear', async (req, res) => {
    const lectura = {
        data: {
            spotterId: "SPOT-32394C",
            spotterName: "YPFB",
            payloadType: "waves",
            batteryVoltage: 4.01,
            batteryPower: -0.24,
            solarVoltage: 0.11,
            humidity: 4,
            track: [{
                latitude: -18.4589833,
                longitude: -70.3206667,
                timestamp: "2025-05-29T23:40:00.000Z"
            }],
            waves: [{
                significantWaveHeight: 1.06,
                peakPeriod: 11.38,
                meanPeriod: 9.3,
                peakDirection: 235.037,
                peakDirectionalSpread: 15.421,
                meanDirection: 237.928,
                meanDirectionalSpread: 26.522,
                timestamp: "2025-05-29T23:40:00.000Z",
                latitude: -18.45898,
                longitude: -70.32067
            }],
            frequencyData: []
        }
    };

    try {
        const resultado = await db.collection('lecturas').insertOne(lectura);
        res.json({ mensaje: 'Lectura insertada', id: resultado.insertedId });
    } catch (err) {
        console.error('Error al insertar en MongoDB:', err);
        res.status(500).send('Error al insertar lectura');
    }
});

app.get('/usuarios', async (req, res) => {
    try {
        const usuarios = await db.collection('usuarios').find().toArray();
        res.json(usuarios);
    } catch (err) {
        res.status(500).send('Error al obtener usuarios');
    }
});

app.post('/upload', upload.single('file'), (req, res) => {
    console.log('📁 Archivo recibido:', req.file.originalname);
    res.send('Archivo recibido correctamente');
});

// ==============================
// Conexión MongoDB y servidor Express
// ==============================

MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(client => {
        console.log('✅ Conectado a MongoDB');
        db = client.db(dbName);

        app.listen(port, hostname, () => {
            console.log(`🚀 Servidor corriendo en http://${hostname}:${port}/`);
        });
    })
    .catch(err => {
        console.error('❌ Error de conexión a MongoDB:', err);
    });

// ==============================
// Watchdog Carpeta 1
// ==============================

console.log(`🕵️ Observando la carpeta: ${carpeta} ...`);

fs.watch(carpeta, (eventType, filename) => {
    if (filename && path.extname(filename).toLowerCase() === '.txt') {
        const tipo = eventType === 'rename' ? 'creado o eliminado' : 'modificado';
        console.log(`📄 Archivo .txt ${tipo}: ${filename}`);
        // Aquí tu función enviarArchivo si la implementas
    }
});

// ==============================
// Watchdog Carpeta 2 + Python
// ==============================

console.log(`🕵️ Observando la carpeta: ${carpeta2} ...`);

fs.watch(carpeta2, (eventType, filename) => {
    if (filename && path.extname(filename).toLowerCase() === '.txt') {
        const fullPath = path.join(carpeta2, filename);
        const tipo = eventType === 'rename' ? 'creado o eliminado' : 'modificado';
        console.log(`📄 Archivo .txt ${tipo}: ${filename}`);

        const command = `python3 formato8.py "${fullPath}"`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`❌ Error al ejecutar Python: ${error.message}`);
                return;
            }
            if (stderr) {
                console.error(`⚠️ STDERR: ${stderr}`);
            }

            console.log(`✅ Salida del script Python:\n${stdout}`);

            try {
                const jsonObjects = stdout
                    .split(/(?<=\})\s*(?=\{)/g)
                    .map(objStr => objStr.trim());

                const parsedObjects = jsonObjects.map(objStr => JSON.parse(objStr));

                console.log("📊 Objetos JSON parseados:");
                parsedObjects.forEach((obj, index) => {
                    console.log(`--- Burst #${obj["Burst#"]} ---`);
                    console.dir(obj, { depth: null });
                });
            } catch (parseError) {
                console.error("❌ Error al parsear la salida JSON:", parseError.message);
            }
        });
    }
});

// ==============================
// Función opcional para obtener datos externos
// ==============================

async function obtenerDatosSpotter() {
    try {
        const response = await fetch("https://api.sofarocean.com/api/latest-data?spotterId=SPOT-32394C", {
            method: "GET",
            headers: { "token": "456debbae1201b1142d2004657e83f" }
        });

        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

        const data = await response.json();

        console.log("=== Datos completos ===");
        console.log(JSON.stringify(data, null, 2));

        console.log("\n=== Contenido de 'track' ===");
        console.log(JSON.stringify(data.data.track, null, 2));

        console.log("\n=== Contenido de 'waves' ===");
        console.log(JSON.stringify(data.data.waves, null, 2));
    } catch (error) {
        console.error("Error al obtener datos del Spotter:", error.message);
    }
}
