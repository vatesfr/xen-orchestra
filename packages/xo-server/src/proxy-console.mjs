import { connect } from 'tls'
import { createLogger } from '@xen-orchestra/log'
import { URL, parse } from 'url'
import WebSocket from 'ws'
import partialStream from 'partial-stream'

const log = createLogger('xo:proxy-console')

function proxyConsoleLegacy(ws, vmConsole, sessionId) {
  console.log('FALLBACK')
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

export default function proxyConsole(ws, vmConsole, sessionId, agent) {
  const url = new URL(vmConsole.location)
  url.protocol = 'wss:'
  let { hostname } = url
  if (hostname === null || hostname === '') {
    const { address } = vmConsole.$VM.$resident_on
    hostname = address

    log.warn(
      `host is missing in console (${vmConsole.uuid}) URI (${vmConsole.location}) using host address (${address}) as fallback`
    )
  }

  let closed = false
  let triedLegacy = false
  let openned = false
  const socket = new WebSocket(url, ['binary'], {
    agent,
    rejectUnauthorized: false,
    headers: {
      cookie: `session_id=${sessionId}`,
    },
  })

  const onSend = error => {
    if (error) {
      log.debug('error sending to the XO client:', { error })
    }
  }

  socket
    .on('open', () => {
      console.log('OPEN')
      ws.on('error', error => {
        closed = true
        log.debug('error from the XO client:', { error })
        socket.end()
      })
        .on('message', data => {
          if (!closed) {
            socket.send(data, { binary: true })
          }
        })
        .on('close', () => {
          if (!closed) {
            closed = true
            log.debug('disconnected from the XO client')
          }
        })
      openned = true
    })
    .on('unexpected-response', (request, response) => {
      console.log('UNEXPECTED RESPONSE')
      if (agent === undefined && !triedLegacy) {
        triedLegacy = true
        proxyConsoleLegacy(ws, vmConsole, sessionId)
      }
    })
    .on('message', data => {
      if (!closed) {
        ws.send(data, onSend)
      }
    })
    .on('error', error => {
      log.warn('error using websocket', error)
    })
    .on('close', () => {
      closed = true
      openned === true && ws.close()
    })
}
