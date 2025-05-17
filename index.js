const http = require('http')

const hostname = '192.168.56.1'
const port = 3000

const server = http.createServer( (req, res ) => {
    res.statusCode = 200
    res.setHeader('Content-Type', 'text-plain')
    res.end('Este es mi primer servidor en node!\n')
})

server.listen( port, hostname, () => {
    console.log(`Server runnint at https://${hostname}:${port}/`)
})