import assert from 'node:assert/strict'
import dgram from 'node:dgram'
import fs from 'node:fs'
import net from 'node:net'
import tls from 'node:tls'
import { after, describe, it } from 'node:test'
import { setTimeout as wait } from 'node:timers/promises'

import { createClient, FACILITIES, SEVERITIES } from './index.js'

const fixture = name => fs.readFileSync(new URL(`./tests/${name}`, import.meta.url), 'utf8')
const CA = fixture('ca.pem')

const servers = []
after(() => servers.forEach(server => server.close()))

const listen = server =>
  new Promise(resolve => {
    servers.push(server)
    server.listen(0, '127.0.0.1', () => resolve(server.address().port))
  })

// stream server collecting the received data
async function createStreamServer(createServer = net.createServer) {
  const server = { data: '', sockets: new Set() }
  server.port = await listen(
    createServer(socket => {
      server.sockets.add(socket)
      socket.on('close', () => server.sockets.delete(socket))
      socket.on('data', data => (server.data += data))
    })
  )
  return server
}

async function createUdpServer() {
  const messages = []
  const socket = dgram.createSocket('udp4').on('message', message => messages.push(message.toString()))
  servers.push(socket)
  await new Promise(resolve => socket.bind(0, '127.0.0.1', resolve))
  return { messages, port: socket.address().port }
}

describe('createClient()', () => {
  it('rejects invalid URIs and options', () => {
    for (const uri of ['syslog.lan', 'http://syslog.lan', 'udp://', 'udp://:514', undefined]) {
      assert.throws(() => createClient(uri), /invalid syslog URI/, String(uri))
    }
    assert.throws(() => createClient('udp://h', { facility: 'foo' }), /invalid syslog facility/)
    assert.throws(() => createClient('udp://h', { format: 'foo' }), /invalid syslog format/)
    assert.throws(() => createClient('udp://h', { framing: 'foo' }), /invalid syslog framing/)
  })

  it('exposes the facility and severity names', () => {
    assert(FACILITIES.includes('authpriv'))
    assert.equal(SEVERITIES[4], 'warning')
  })
})

describe('send()', () => {
  it('formats RFC 5424 messages', async () => {
    const server = await createUdpServer()
    const client = createClient(` udp://127.0.0.1:${server.port} `, {
      appName: 'my app',
      facility: 'authpriv',
      hostname: 'host',
    })
    await client.send('{"foo":"bar"}', {
      msgid: 'some event',
      severity: 'warning',
      timestamp: new Date('2026-01-02T03:04:05.678Z'),
    })
    await wait(50)
    client.close()

    // header fields are sanitized: no spaces
    assert.deepEqual(server.messages, [
      `<84>1 2026-01-02T03:04:05.678Z host my_app ${process.pid} some_event - {"foo":"bar"}`,
    ])
  })

  it('formats RFC 3164 messages', async () => {
    const server = await createUdpServer()
    const client = createClient(`udp://127.0.0.1:${server.port}`, {
      appName: 'app',
      format: 'rfc3164',
      hostname: 'host',
    })
    await client.send('message', { timestamp: new Date(2026, 0, 2, 3, 4, 5) })
    await wait(50)
    client.close()

    assert.deepEqual(server.messages, [`<14>Jan  2 03:04:05 host app[${process.pid}]: message`])
  })

  it('rejects an invalid severity', async () => {
    await assert.rejects(
      createClient('udp://127.0.0.1').send('message', { severity: 'foo' }),
      /invalid syslog severity/
    )
  })

  it('frames TCP messages with a line feed by default', async () => {
    const server = await createStreamServer()
    const client = createClient(`tcp://127.0.0.1:${server.port}`)
    await client.send('foo')
    await client.send('bar')
    await wait(50)
    client.close()

    assert.match(server.data, /^<14>1 [^\n]+ - foo\n<14>1 [^\n]+ - bar\n$/)
  })

  it('frames TCP messages with octet counting', async () => {
    const server = await createStreamServer()
    const client = createClient(`tcp://127.0.0.1:${server.port}`, { framing: 'octet-counting' })
    await client.send('foo')
    await client.send('bär')
    await wait(50)
    client.close()

    // each message is prefixed by its length in bytes
    const buffer = Buffer.from(server.data)
    const messages = []
    for (let offset = 0; offset < buffer.length; ) {
      const space = buffer.indexOf(' ', offset)
      const length = Number(buffer.toString('utf8', offset, space))
      messages.push(buffer.toString('utf8', space + 1, space + 1 + length))
      offset = space + 1 + length
    }
    assert.equal(messages.length, 2)
    assert.match(messages[0], /^<14>1 .+ - foo$/)
    assert.match(messages[1], /^<14>1 .+ - bär$/)
  })

  it('reconnects when the server closes the connection', async () => {
    const server = await createStreamServer()
    const client = createClient(`tcp://127.0.0.1:${server.port}`)
    await client.send('first')
    await wait(50)
    server.sockets.forEach(socket => socket.destroy())
    await wait(50)
    await client.send('second')
    await wait(50)
    client.close()

    assert.match(server.data, /first\n.*second\n$/s)
  })

  it('reports why the connection failed', async () => {
    await assert.rejects(createClient('tcp://127.0.0.1:1').send('message'), { code: 'ECONNREFUSED' })

    // several addresses (::1 and 127.0.0.1) fail with an AggregateError, which has no message by itself
    await assert.rejects(createClient('tcp://localhost:1').send('message'), error => {
      assert.match(error.message, /ECONNREFUSED/)
      assert(error.stack.startsWith(`${error.name}: ${error.message}\n`))
      return true
    })
  })

  it('stops connecting after connectTimeout, with a single socket', async () => {
    // accepts the TCP connection but never answers the TLS handshake
    const port = await listen(net.createServer(socket => socket.resume()))
    const client = createClient(`tls://127.0.0.1:${port}`, { connectTimeout: 200 })
    const sockets = new Set()

    const start = Date.now()
    const result = client.send('message').catch(error => error)
    sockets.add(client._socket)
    client.send('message').catch(Function.prototype)
    sockets.add(client._socket)

    assert.equal((await result).message, 'connection timed out')
    assert(Date.now() - start < 1e3)
    assert.equal(sockets.size, 1)
  })

  it('drops messages when too much is waiting to be sent', async () => {
    // never reads
    const port = await listen(net.createServer(socket => socket.pause()))
    const client = createClient(`tcp://127.0.0.1:${port}`, { maxPendingBytes: 64 * 1024 })

    const message = 'x'.repeat(1024)
    const results = []
    for (let i = 0; i < 10e3; ++i) {
      results.push(
        client.send(message).then(
          () => 'sent',
          () => 'dropped'
        )
      )
    }
    await wait(500)
    client.close()

    assert(client._socket === undefined)
    assert((await Promise.all(results)).includes('dropped'))
  })

  it('closes a connection which is being established', async () => {
    const server = await createStreamServer()
    const client = createClient(`tcp://127.0.0.1:${server.port}`)
    const socket = (client.send('message').catch(Function.prototype), client._socket)
    client.close()
    await wait(100)

    assert(socket.destroyed)
    assert.equal(server.sockets.size, 0)
  })
})

describe('TLS', () => {
  const createTlsServer = () =>
    createStreamServer(listener =>
      tls.createServer({ cert: fixture('server.pem'), key: fixture('server.key') }, listener)
    )

  it('trusts additional certificate authorities', async () => {
    const server = await createTlsServer()
    const client = createClient(`tls://localhost:${server.port}`, { ca: [CA] })
    await client.send('message')
    await wait(50)
    client.close()

    assert.match(server.data, / - message\n$/)
  })

  it('rejects an unknown certificate authority, unless ignoreUnauthorized', async () => {
    const server = await createTlsServer()
    await assert.rejects(createClient(`tls://localhost:${server.port}`).send('message'), {
      code: 'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
    })

    const client = createClient(`tls://localhost:${server.port}`, { ignoreUnauthorized: true })
    await client.send('message')
    client.close()
  })

  it('defaults to port 6514', () => {
    assert.equal(createClient('tls://localhost')._port, 6514)
    assert.equal(createClient('tcp://[::1]')._port, 514)
    assert.equal(createClient('tcp://[::1]')._host, '::1')
  })
})
