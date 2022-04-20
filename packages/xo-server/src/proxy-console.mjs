import { connect } from 'tls'
import { createLogger } from '@xen-orchestra/log'
import { URL } from 'url'
import fromEvent from 'promise-toolbox/fromEvent'
import WebSocket from 'ws'
import partialStream from 'partial-stream'

const log = createLogger('xo:proxy-console')

export default async function proxyConsole(clientSocket, vmConsole, sessionId, agent) {
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

  const serverSocket = new WebSocket(url, ['binary'], {
    agent,
    rejectUnauthorized: false,
    headers: {
      cookie: `session_id=${sessionId}`,
    },
  })

  try {
    await fromEvent(serverSocket, 'open')
  } catch (error) {
    return proxyConsoleLegacy(clientSocket, url, sessionId)
  }

  // symmetrically connect client and socket
  for (const [fromName, fromSocket, toName, toSocket] of [
    ['client', clientSocket, 'server', serverSocket],
    ['server', serverSocket, 'client', clientSocket],
  ]) {
    const onSend = error => {
      if (error != null) {
        log.debug('error sending to the ' + toName, { error })
      }
    }

    fromSocket
      .on('message', data => {
        if (toSocket.readyState === WebSocket.OPEN) {
          toSocket.send(data, { binary: true }, onSend)
        }
      })
      .on('close', (code, reason) => {
        log.debug('disconnected from the ' + fromName, { code, reason })
        toSocket.close()
      })
      .on('error', error => {
        log.debug('error from the ' + fromName, { error })
      })
  }
}

function proxyConsoleLegacy(ws, url, sessionId) {
  console.log('FALLBACK')

  let closed = false

  const socket = connect(
    {
      host: url.hostname,
      port: url.port || 443,
      rejectUnauthorized: false,

      // Support XS <= 6.5 with Node => 12
      minVersion: 'TLSv1',
    },
    () => {
      // Write headers.
      socket.write(
        [
          `CONNECT ${url.pathname + url.search} HTTP/1.0`,
          `Host: ${url.hostname}`,
          `Cookie: session_id=${sessionId}`,
          '',
          '',
        ].join('\r\n')
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
