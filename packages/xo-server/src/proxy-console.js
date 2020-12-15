import createLogger from '@xen-orchestra/log'
import partialStream from 'partial-stream'
import { connect } from 'tls'
import { parse } from 'url'

const log = createLogger('xo:proxy-console')

export default function proxyConsole(ws, vmConsole, sessionId) {
  const url = parse(vmConsole.location)
  let { hostname } = url
  if (hostname === null || hostname === '') {
    const { address } = vmConsole.$VM.$resident_on
    hostname = address

    log.warn(
      `host is missing in console (${vmConsole.uuid}) URI (${vmConsole.location}) using host address (${address}) as fallback`
    )
  }

  let closed = false

  const socket = connect(
    {
      host: hostname,
      port: url.port || 443,
      rejectUnauthorized: false,

      // Support XS <= 6.5 with Node => 12
      minVersion: 'TLSv1',
    },
    () => {
      // Write headers.
      socket.write(
        [`CONNECT ${url.path} HTTP/1.0`, `Host: ${hostname}`, `Cookie: session_id=${sessionId}`, '', ''].join('\r\n')
      )

      const onSend = error => {
        if (error) {
          log.debug('error sending to the XO client:', { error })
        }
      }

      socket
        .pipe(
          partialStream('\r\n\r\n', headers => {
            // TODO: check status code 200.
            log.debug('connected')
          })
        )
        .on('data', data => {
          if (!closed) {
            ws.send(data, onSend)
          }
        })
        .on('end', () => {
          if (!closed) {
            closed = true
            log.debug('disconnected from the console')
          }

          ws.close()
        })

      ws.on('error', error => {
        closed = true
        log.debug('error from the XO client:', { error })

        socket.end()
      })
        .on('message', data => {
          if (!closed) {
            socket.write(data)
          }
        })
        .on('close', () => {
          if (!closed) {
            closed = true
            log.debug('disconnected from the XO client')
          }

          socket.end()
        })
    }
  ).on('error', error => {
    closed = true
    log.debug('error from the console:', { error })

    ws.close()
  })
}
