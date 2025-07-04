// Ya tienes esto
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

// ✅ Solo añadimos el servido de imágenes y recursos front
app.use('/index_files', express.static(path.join(__dirname, 'Public/index_files')));
app.use('/images', express.static(path.join(__dirname, 'Public/images')));

// Mantienes todo lo que ya tenías
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

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'Public/index.html'));
});

// Ruta opcional para Cover anterior
app.get('/cover', (req, res) => {
    res.sendFile(path.join(__dirname, 'Cover Template for Bootstrap.html'));
});

// Ruta para upload
app.post('/upload', upload.single('file'), (req, res) => {
    console.log('📁 Archivo recibido:', req.file.originalname);
    res.send('Archivo recibido correctamente');
});

// Watcher transferencia2
console.log(`🕵️ Observando la carpeta: ${carpetaTransferencia} ...`);
fs.watch(carpetaTransferencia, (eventType, filename) => {
    if (filename && path.extname(filename).toLowerCase() === '.txt') {
        console.log(`📄 Archivo en transferencia2 ${eventType}: ${filename}`);
    }
});

// Watcher uploads y proceso Python
console.log(`🕵️ Observando la carpeta: ${carpetaUploads} ...`);

let timer;
let procesando = false;

fs.watch(carpetaUploads, (eventType, filename) => {
    if (!filename) return;
    if (filename !== archivoObjetivo) return;

    console.log(`📁 Archivo recibido en uploads ${eventType}: ${filename}`);

    clearTimeout(timer);

    timer = setTimeout(() => {
        if (procesando) {
            console.log('⚠️ Ya se está procesando un archivo, se ignora este evento.');
            return;
        }

        procesando = true;

        const fullPath = path.join(carpetaUploads, filename);
        console.log(`🚀 Ejecutando verificación externa sobre: ${filename}`);

        exec(`python3 verified.py "${fullPath}"`, (error, stdout, stderr) => {
            if (error) {
                console.error(`❌ Error ejecutando Python: ${error.message}`);
                procesando = false;
                return;
            }
            if (stderr) {
                console.error(`⚠️ STDERR: ${stderr}`);
            }
            if (stdout) {
                console.log(`📊 Verificación Python recibida:`);

                const lineas = stdout.trim().split('\n');
                console.log(`🔢 Total de líneas detectadas: ${lineas.length}`);

                lineas.forEach(registro => {
                    const datos = registro.split(',').map(d => d.trim());

                    if (datos.length < 16 || isNaN(parseFloat(datos[0]))) {
                        console.log(`ℹ️ Línea ignorada (control o inválida): ${registro}`);
                        return;
                    }

                    const profile = [];
                    for (let i = 16; i < datos.length - 1; i += 2) {
                        const mag = parseFloat(datos[i]);
                        const dir = parseFloat(datos[i + 1]);
                        if (isNaN(mag) || isNaN(dir)) continue;

                        profile.push({
                            Magnitude: mag,
                            Direction: dir
                        });
                    }

                    const doc = {
                        Timestamp: {
                            Year: datos[1],
                            Month: datos[2],
                            Day: datos[3],
                            Hour: datos[4],
                            Minute: datos[5],
                            Second: datos[6],
                            Centisecond: datos[7]
                        },
                        Hs: parseFloat(datos[8]),
                        Tp: parseFloat(datos[9]),
                        Dp: parseFloat(datos[10]),
                        Depth: parseFloat(datos[11]),
                        'H1/10': parseFloat(datos[12]),
                        Tmean: parseFloat(datos[13]),
                        Dmean: parseFloat(datos[14]),
                        '#bins': parseInt(datos[15]),
                        Profile: profile,
                        n_registro: parseInt(datos[0])
                    };

                    // Validación rápida de campos críticos antes de insertar
                    if (isNaN(doc.Hs) || isNaN(doc.Tp) || isNaN(doc.Depth) || isNaN(doc.n_registro)) {
                        console.error(`❌ Registro inválido, campos numéricos corruptos:`, registro);
                        return;
                    }

                    db.collection('registros').insertOne(doc)
                        .then(() => console.log(`✅ Registro ${doc.n_registro} insertado correctamente en MongoDB`))
                        .catch(err => console.error(`❌ Error insertando en MongoDB registro ${doc.n_registro}:`, err));
                });

                console.log(`✅ Proceso completo. Esperando nuevos archivos...`);
            }

            procesando = false;
        });

    }, 2000);
});
