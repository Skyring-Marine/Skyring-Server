const express = require('express');
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
const multer = require('multer');
const crypto = require('crypto');

const hostname = '172.31.39.213';
const port = 3000;
const url = 'mongodb://127.0.0.1:27017';
const dbName = 'myproject';
let db;

const carpetaTransferencia = path.join(__dirname, 'transferencia2');
const carpetaUploads = path.join(__dirname, 'uploads');
const archivoObjetivo = 'WAVES_000_000_LOG8_verified.TXT';  // Ya viene con _verified

const app = express();

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, carpetaUploads),
    filename: (req, file, cb) => cb(null, file.originalname)
});
const upload = multer({ storage });

console.log('SERVER AJUSTADO');

MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(client => {
        console.log('✅ Conectado a MongoDB');
        db = client.db(dbName);

        app.listen(port, hostname, () => {
            console.log(`🚀 Servidor corriendo en http://${hostname}:${port}/`);
        });
    })
    .catch(err => console.error('❌ Error de conexión a MongoDB:', err));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'Cover Template for Bootstrap.html')));

app.post('/upload', upload.single('file'), (req, res) => {
    console.log('📁 Archivo recibido:', req.file.originalname);
    res.send('Archivo recibido correctamente');
});

console.log(`🕵️ Observando la carpeta: ${carpetaTransferencia} ...`);
fs.watch(carpetaTransferencia, (eventType, filename) => {
    if (filename && path.extname(filename).toLowerCase() === '.txt') {
        console.log(`📄 Archivo en transferencia2 ${eventType}: ${filename}`);
    }
});

console.log(`🕵️ Observando la carpeta: ${carpetaUploads} ...`);
const archivosProcesados = new Set();

fs.watch(carpetaUploads, (eventType, filename) => {
    if (!filename) return;
    if (filename !== archivoObjetivo) return;

    const fullPath = path.join(carpetaUploads, filename);
    if (archivosProcesados.has(fullPath)) return;

    archivosProcesados.add(fullPath);
    setTimeout(() => archivosProcesados.delete(fullPath), 3000);

    console.log(`📄 Detectado archivo objetivo en uploads ${eventType}: ${filename}`);

    calcularHashArchivo(fullPath)
        .then(async (hashActual) => {
            const registroArchivo = await db.collection('archivosProcesados').findOne({ nombreArchivo: filename });
            if (registroArchivo && registroArchivo.hash === hashActual) {
                console.log(`⚠️ Archivo ${filename} NO cambió. Saltando procesamiento.`);
                return;
            }

            console.log(`✅ Archivo ${filename} cambió o es nuevo. Analizando cantidad de registros...`);

            try {
                const contenido = fs.readFileSync(fullPath, 'utf-8');
                
                const registros = contenido.split('<FINISH>').filter(r => r.trim().length > 0);
                
                console.log(`📊 Total de registros detectados: ${registros.length}`);
                
                await db.collection('archivosProcesados').updateOne(
                    { nombreArchivo: filename },
                    { $set: { hash: hashActual, fecha: new Date(), total_registros: registros.length } },
                    { upsert: true }
                );

                console.log(`✅ Hash y cantidad de registros actualizados en la base de datos.`);

            } catch (errLectura) {
                console.error(`❌ Error leyendo o procesando el archivo: ${errLectura.message}`);
            }
        })
        .catch(err => console.error(`❌ Error al calcular hash de ${filename}:`, err.message));
});

function calcularHashArchivo(ruta) {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha256');
        const stream = fs.createReadStream(ruta);
        stream.on('data', chunk => hash.update(chunk));
        stream.on('end', () => resolve(hash.digest('hex')));
        stream.on('error', err => reject(err));
    });
}
