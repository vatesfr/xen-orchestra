import { connect } from 'tls'
import { createLogger } from '@xen-orchestra/log'
import { URL } from 'url'
import fromEvent from 'promise-toolbox/fromEvent'
import WebSocket from 'ws'
import partialStream from 'partial-stream'

const log = createLogger('xo:proxy-console')

// create a function that will
// - send data in binary
// - not error if the socket is closed
// - properly log any errors
function createSend(socket, name) {
  function onSend(error) {
    if (error != null) {
      log.debug('error sending to the ' + name, { error })
    }
  }
  return function send(data) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(data, { binary: true }, onSend)
    }
  }
}

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

  // create a function that will enqueue data before the socket is open
  //
  // necessary to avoid losing messages from the client
  let sendToServer = (() => {
    let queue = []
    serverSocket.on('open', () => {
      sendToServer = createSend(serverSocket, 'server')
      queue.forEach(sendToServer)
      queue = undefined
    })

    return data => {
      queue.push(data)
    }
  })()

  clientSocket.on('message', data => sendToServer(data))
  serverSocket.on('message', createSend(clientSocket, 'client'))

  try {
    await fromEvent(serverSocket, 'open')
  } catch (error) {
    log.debug('failing to open the server socket, fallback to legacy implementation', { error })
    return proxyConsoleLegacy(clientSocket, url, sessionId)
  }

  // symmetrically connect client and socket
  for (const [fromName, fromSocket, toSocket] of [
    ['client', clientSocket, serverSocket],
    ['server', serverSocket, clientSocket],
  ]) {
    fromSocket
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
