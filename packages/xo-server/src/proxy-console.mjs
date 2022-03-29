import { createLogger } from '@xen-orchestra/log'
import { URL } from 'url'
import WebSocket from 'ws'

const log = createLogger('xo:proxy-console')

export default function proxyConsole(ws, vmConsole, sessionId, agent) {
  const url = new URL(vmConsole.location)
  url.protocol = 'wss:'
  const { hostname } = url
  if (hostname === null || hostname === '') {
    const { address } = vmConsole.$VM.$resident_on
    url.hostname = address

    log.warn(
      `host is missing in console (${vmConsole.uuid}) URI (${vmConsole.location}) using host address (${address}) as fallback`
    )
  }

  let closed = false

  const onSend = error => {
    if (error) {
      log.debug('error sending to the XO client:', { error })
    }
  }

  const socket = new WebSocket(url, ['binary'], {
    agent,
    rejectUnauthorized: false,
    headers: {
      cookie: `session_id=${sessionId}`,
    },
  })

  socket
    .on('message', data => {
      if (!closed) {
        ws.send(data, onSend)
      }
    })
    .on('error', error => {
      log.warn('error,', error, socket.protocol)
    })
    .on('close', () => {
      closed = true
      ws.close()
    })

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
}
