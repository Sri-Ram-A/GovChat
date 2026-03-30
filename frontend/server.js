const { createServer } = require('https')
const { parse } = require('url')
const next = require('next')
const fs = require('fs')
const path = require('path')

const dev = process.env.NODE_ENV !== 'production'
const hostname = '0.0.0.0'
const port = 3000

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

const httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, '../keys/localhost+3-key.pem')),
  cert: fs.readFileSync(path.join(__dirname, '../keys/localhost+3.pem'))
}
const os = require("os");

function getLocalIPv4() {
  const interfaces = os.networkInterfaces();

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (
        iface.family === "IPv4" &&
        !iface.internal
      ) {
        return iface.address;
      }
    }
  }

  return "localhost";
}


app.prepare().then(() => {
  createServer(httpsOptions, async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })
    .once('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      const localIP = getLocalIPv4();
      console.log(`> Ready on https://${hostname}:${port}`);
      console.log(`> Local:   https://localhost:${port}`);
      console.log(`> Network: https://${localIP}:${port}`);
    });

})