import createDebug from 'debug'
import partialStream from 'partial-stream'
import {connect} from 'tls'
import {parse} from 'url'

const debug = createDebug('xo:proxy-console')

export default function proxyConsole (ws, vmConsole, sessionId) {
  const url = parse(vmConsole.location)

  let closed = false

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

    const onSend = (error) => {
      if (error) {
        debug('error sending to the XO client: %s', error.stack || error.message || error)
      }
    }

    socket.pipe(partialStream('\r\n\r\n', headers => {
      // TODO: check status code 200.
      debug('connected')
    })).on('data', data => {
      if (!closed) {
        ws.send(data, onSend)
      }
    }).on('end', () => {
      if (!closed) {
        closed = true
        debug('disconnected from the console')
      }

      ws.close()
    })

    ws
      .on('error', error => {
        closed = true
        debug('error from the XO client: %s', error.stack || error.message || error)

        socket.close()
      })
      .on('message', data => {
        if (!closed) {
          socket.write(data)
        }
      })
      .on('close', () => {
        if (!closed) {
          closed = true
          debug('disconnected from the XO client')
        }

        socket.end()
      })
  }).on('error', error => {
    closed = true
    debug('error from the console: %s', error.stack || error.message || error)

    ws.close()
  })
}
