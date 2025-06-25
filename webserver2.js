const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { MongoClient } = require('mongodb');
const { exec } = require('child_process');

const app = express();
const hostname = '192.168.1.7';
const port = 3000;

// Configuración de MongoDB
const mongoUrl = 'mongodb://127.0.0.1:27017';
const dbName = 'myproject';
let db;

// Conexión a MongoDB
MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(client => {
    console.log('✅ Conectado a MongoDB');
    db = client.db(dbName);

    app.listen(port, hostname, () => {
      console.log(`🚀 Servidor Express corriendo en http://${hostname}:${port}`);
    });
  })
  .catch(err => {
    console.error('❌ Error al conectar a MongoDB:', err);
  });

// Middleware para leer archivos estáticos
app.use(express.static(__dirname));

// Ruta para servir HTML principal
app.get('/', (req, res) => {
  const filePath = path.join(__dirname, 'Cover Template for Bootstrap.html');
  res.sendFile(filePath);
});

// Ruta para insertar lectura simulada
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
    console.error('❌ Error al insertar en MongoDB:', err);
    res.status(500).send('Error al insertar lectura');
  }
});

// Ruta para listar usuarios
app.get('/usuarios', async (req, res) => {
  try {
    const usuarios = await db.collection('usuarios').find().toArray();
    res.json(usuarios);
  } catch (err) {
    res.status(500).send('Error al obtener usuarios');
  }
});

// Configuración de Multer para carga de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage });

// Ruta para subir archivo vía POST
app.post('/upload', upload.single('file'), (req, res) => {
  console.log('📁 Archivo recibido:', req.file.originalname);
  res.send('Archivo recibido correctamente');
});

// =====================
// Watchdog de carpetas
// =====================

const carpeta = '/home/ubuntu/Skyring-Server/transferencia2';
const carpeta2 = '/home/ubuntu/Skyring-Server/uploads';

console.log(`🕵️ Observando carpeta 1: ${carpeta}`);
fs.watch(carpeta, (eventType, filename) => {
  if (filename && path.extname(filename).toLowerCase() === '.txt') {
    console.log(`📄 Archivo .txt ${eventType === 'rename' ? 'creado/eliminado' : 'modificado'}: ${filename}`);
    // Aquí podrías llamar a `enviarArchivo()` si tienes esa función.
  }
});

console.log(`🕵️ Observando carpeta 2: ${carpeta2}`);
fs.watch(carpeta2, (eventType, filename) => {
  if (filename && path.extname(filename).toLowerCase() === '.txt') {
    const fullPath = path.join(carpeta2, filename);
    console.log(`📄 Archivo .txt ${eventType === 'rename' ? 'creado/eliminado' : 'modificado'}: ${filename}`);

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
        parsedObjects.forEach(obj => {
          console.dir(obj, { depth: null });
        });
      } catch (parseError) {
        console.error("❌ Error al parsear la salida JSON:", parseError.message);
      }
    });
  }
});
