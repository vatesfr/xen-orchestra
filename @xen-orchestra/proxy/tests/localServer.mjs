import { createServer as creatServerHttps } from 'https';
import { createServer as creatServerHttp } from 'http';

import { parse } from 'url';
import { WebSocketServer } from 'ws';
import fs from 'fs'

const httpsServer = creatServerHttps({
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
});
const httpServer = creatServerHttp();

const wss = new WebSocketServer({ noServer: true, perMessageDeflate: false });

function upgrade(request, socket, head) {
  const { pathname } = parse(request.url);
console.log('will upgrade', pathname)
  // web socket server only on /foo url
  if (pathname === '/foo') {
    wss.handleUpgrade(request, socket, head, function done(ws) {
      wss.emit('connection', ws, request);
      ws.on('message', function message(data) {
        console.log('received: %s', data);
        ws.send(data);

      });
    });
  } else {
    socket.destroy();
  }
}

function httpHandler(req, res){
  console.log(req.url)
  switch(req.url){
    case '/index.html':
      res.end('hi')
      return
      case '/redirect':
        res.writeHead(301, {
          'Location': 'index.html'
        })
        res.end()
        return
      case '/chainRedirect':
        res.writeHead(301, {
          'Location': '/redirect'
        })
        res.end()
        return
      default:
      res.writeHEad(404)
      res.end()
  }
}

httpsServer.on('upgrade', upgrade);
httpServer.on('upgrade', upgrade);

httpsServer.on('request', httpHandler)
httpServer.on('request', httpHandler)


httpsServer.listen(8080);
httpServer.listen(8081);
