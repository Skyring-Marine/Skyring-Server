
const http = require('http');
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

const hostname = '192.168.0.19';
const port = 3000;

const url = 'mongodb://127.0.0.1:27017';
const dbName = 'myproject';

let db;

// Conectar a MongoDB
MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(client => {
        console.log('Conectado a MongoDB');
        db = client.db(dbName);

        server.listen(port, hostname, () => {
            console.log(`Servidor corriendo en http://${hostname}:${port}/`);
        });
    })
    .catch(err => {
        console.error('Error de conexión a MongoDB:', err);
    });

const server = http.createServer((req, res) => {
    if (req.url === '/' || req.url === '/Cover Template for Bootstrap.html') {
        const filePath = path.join(__dirname, 'Cover Template for Bootstrap.html');
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'text/plain');
                res.end('Error interno del servidor');
            } else {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'text/html');
                res.end(data);
            }
        });
    } else if (req.url === '/crear') {
        const lectura = {
            data: {
                spotterId: "SPOT-32394C",
                spotterName: "YPFB",
                payloadType: "waves",
                batteryVoltage: 4.01,
                batteryPower: -0.24,
                solarVoltage: 0.11,
                humidity: 4,
                track: [
                    {
                        latitude: -18.4589833,
                        longitude: -70.3206667,
                        timestamp: "2025-05-29T23:40:00.000Z"
                    }
                ],
                waves: [
                    {
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
                    }
                ],
                frequencyData: []
            }
        };

        db.collection('lecturas').insertOne(lectura)
            .then(resultado => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ mensaje: 'Lectura insertada', id: resultado.insertedId }));
            })
            .catch(err => {
                console.error('Error al insertar en MongoDB:', err);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'text/plain');
                res.end('Error al insertar lectura');
            });

    } else if (req.url === '/usuarios') {
        db.collection('usuarios').find().toArray()
            .then(usuarios => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(usuarios));
            })
            .catch(err => {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'text/plain');
                res.end('Error al obtener usuarios');
            });
    } else {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/plain');
        res.end('Página no encontrada');
    }
});
