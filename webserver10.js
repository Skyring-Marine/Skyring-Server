const express = require('express');
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
const multer = require('multer');
const { exec } = require('child_process');

const hostname = '172.31.39.213';
const port = 3000;
const url = 'mongodb://127.0.0.1:27017';
const dbName = 'myproject';
let db;

const carpetaTransferencia = path.join(__dirname, 'transferencia2');
const carpetaUploads = path.join(__dirname, 'uploads');
const archivoObjetivo = 'WAVES_000_000_LOG8_verified.TXT';

const app = express();

// ✅ Sirve la carpeta index_files como recursos estáticos
app.use('/index_files', express.static(path.join(__dirname, 'Public/index_files')));

// ✅ Si tienes más recursos estáticos (imágenes, CSS globales), puedes servir toda la carpeta Public si lo deseas
// app.use(express.static(path.join(__dirname, 'Public')));

// Configuración de Multer para carga de archivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, carpetaUploads),
    filename: (req, file, cb) => cb(null, file.originalname)
});
const upload = multer({ storage });

console.log('✅ SERVER CON PROCESO EXTERNO PYTHON');

MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(client => {
        console.log('✅ Conectado a MongoDB');
        db = client.db(dbName);

        app.listen(port, hostname, () => {
            console.log(`🚀 Servidor corriendo en http://${hostname}:${port}/`);
        });
    })
    .catch(err => console.error('❌ Error de conexión a MongoDB:', err));

// ✅ Ruta principal para servir index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'Public/index.html'));
});

// Ruta opcional para tu plantilla Bootstrap antigua
app.get('/cover', (req, res) => {
    res.sendFile(path.join(__dirname, 'Cover Template for Bootstrap.html'));
});

// Ruta para subir archivos
app.post('/upload', upload.single('file'), (req, res) => {
    console.log('📁 Archivo recibido:', req.file.originalname);
    res.send('Archivo recibido correctamente');
});

// 🕵️ Observa la carpeta transferencia2
console.log(`🕵️ Observando la carpeta: ${carpetaTransferencia} ...`);
fs.watch(carpetaTransferencia, (eventType, filename) => {
    if (filename && path.extname(filename).toLowerCase() === '.txt') {
        console.log(`📄 Archivo en transferencia2 ${eventType}: ${filename}`);
    }
});

// 🕵️ Observa la carpeta uploads y ejecuta proceso Python al recibir el archivo objetivo
console.log(`🕵️ Observando la carpeta: ${carpetaUploads} ...`);

let timer;
fs.watch(carpetaUploads, (eventType, filename) => {
    if (!filename) return;
    if (filename !== archivoObjetivo) return;

    console.log(`📁 Archivo recibido en uploads ${eventType}: ${filename}`);

    clearTimeout(timer);

    timer = setTimeout(() => {
        const fullPath = path.join(carpetaUploads, filename);
        console.log(`🚀 Ejecutando verificación externa sobre: ${filename}`);

        exec(`python3 verified.py "${fullPath}"`, (error, stdout, stderr) => {
            if (error) {
                console.error(`❌ Error ejecutando Python: ${error.message}`);
                return;
            }
            if (stderr) {
                console.error(`⚠️ STDERR: ${stderr}`);
            }
            if (stdout) {
                console.log(`📊 Verificación Python: ${stdout.trim()}`);
                console.log(`✅ Proceso terminado con éxito.`);
                console.log(`🕐 Esperando actualización de archivo...`);
            }
        });
    }, 2000);
});
