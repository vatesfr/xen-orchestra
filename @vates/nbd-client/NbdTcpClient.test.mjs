import assert from 'node:assert/strict'
import { after, before, describe, it } from 'node:test'
import { createServer as createHttpServer } from 'node:http'
import { connect, createServer as createTcpServer } from 'node:net'
import { once } from 'node:events'

import NbdTcpClient from './NbdTcpClient.mjs'
import { serveNbd } from './tests/fake-nbd-server.mjs'

const BLOCK_SIZE = 64 * 1024
const DATA = Buffer.alloc(4 * BLOCK_SIZE)
for (let i = 0; i < DATA.length; i++) {
  DATA[i] = i % 251
}
const CREDENTIALS = 'Basic ' + Buffer.from('user:p@ss').toString('base64')

describe('NbdTcpClient through an HTTP proxy', () => {
  let nbdServer, proxyServer, nbdPort, proxyPort
  const connectRequests = []

  before(async () => {
    nbdServer = createTcpServer(socket => {
      serveNbd({ readable: socket, writable: socket, data: DATA }).catch(() => {})
    })
    nbdServer.listen(0, '127.0.0.1')
    await once(nbdServer, 'listening')
    nbdPort = nbdServer.address().port

    // minimal CONNECT proxy, similar to the XO Proxy one
    proxyServer = createHttpServer()
    proxyServer.on('connect', (req, clientSocket, head) => {
      connectRequests.push(req.url)
      if (req.headers['proxy-authorization'] !== CREDENTIALS) {
        clientSocket.end('HTTP/1.1 407 Proxy Authentication Required\r\n\r\n')
        return
      }
      const { hostname, port } = new URL('http://' + req.url)
      const serverSocket = connect(port, hostname, () => {
        clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n')
        serverSocket.write(head)
        serverSocket.pipe(clientSocket).pipe(serverSocket)
      })
      serverSocket.on('error', () => clientSocket.destroy())
      clientSocket.on('error', () => serverSocket.destroy())
    })
    proxyServer.listen(0, '127.0.0.1')
    await once(proxyServer, 'listening')
    proxyPort = proxyServer.address().port
  })

  after(() => {
    proxyServer.closeAllConnections()
    proxyServer.close()
    nbdServer.close()
  })

  it('tunnels the NBD connection with CONNECT', async () => {
    const client = new NbdTcpClient({
      address: '127.0.0.1',
      port: nbdPort,
      httpProxy: `http://user:p%40ss@127.0.0.1:${proxyPort}`,
    })
    await client.connect()
    try {
      assert.equal(client.exportSize, BigInt(DATA.length))
      const block = await client.readBlock(2, BLOCK_SIZE)
      assert.deepEqual(block, DATA.subarray(2 * BLOCK_SIZE, 3 * BLOCK_SIZE))
    } finally {
      await client.disconnect()
    }
    assert.equal(connectRequests.at(-1), `127.0.0.1:${nbdPort}`)
  })

  it('fails when the proxy refuses the connection', async () => {
    const client = new NbdTcpClient({
      address: '127.0.0.1',
      port: nbdPort,
      httpProxy: `http://user:wrong@127.0.0.1:${proxyPort}`,
    })
    await assert.rejects(client.connect(), { code: 'NBD_PROXY_CONNECT_FAILED' })
    await client.disconnect().catch(() => {})
  })
})
