import createDebug from 'debug'
import partialStream from 'partial-stream'
import {connect} from 'tls'
import {parse} from 'url'

const debug = createDebug('xo:proxy-console')

export default function proxyConsole (ws, vmConsole, sessionId) {
  const url = parse(vmConsole.location)

  const socket = connect({
    host: url.host,
    port: url.port || 443,
    rejectUnauthorized: false
  }, () => {
    // Write headers.
    socket.write([
      `CONNECT ${url.path} HTTP/1.0`,
      `Host: ${url.hostname}`,
      `Cookie: session_id=${sessionId}`,
      '', ''
    ].join('\r\n'))

    socket.pipe(partialStream('\r\n\r\n', headers => {
      // TODO: check status code 200.
      debug('connected')
    })).on('data', data => {
      // Encode to base 64.
      ws.send(data.toString('base64'))
    }).on('end', () => {
      ws.close()
      debug('disconnected')
    }).on('error', error => {
      ws.close()
      debug('%s', error.stack || error.message || error)
    })

    ws
      .on('error', () => {
        socket.close()
      })
      .on('message', data => {
        // Decode from base 64.
        socket.write(new Buffer(data, 'base64'))
      })
      .on('close', () => {
        socket.end()
      })
  })
}
