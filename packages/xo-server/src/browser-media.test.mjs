import assert from 'node:assert/strict'
import { once } from 'node:events'
import { createServer } from 'node:http'
import { test } from 'node:test'
import WebSocket from 'ws'
import { BrowserMedia } from './browser-media.mjs'

async function fixture(t, respond = true) {
  const media = new BrowserMedia({ timeout: 1000 })
  const server = createServer((req, res) => media.http(req, res, () => res.writeHead(404).end()))
  server.on('upgrade', (req, socket, head) => media.upgrade(req, socket, head))
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const base = `http://127.0.0.1:${server.address().port}`
  const source = Buffer.alloc(3 * 1024 * 1024)
  for (let i = 0; i < source.length; ++i) source[i] = i % 251
  const session = media.create({ owner: 'admin', vm: 'vm', name: 'test.iso', size: source.length })
  const socket = new WebSocket(base.replace('http:', 'ws:') + `/api/browser-media/${session.browserToken}/socket`)
  const reads = []
  socket.on('message', data => {
    const message = JSON.parse(data)
    if (message.ready || !respond) return
    reads.push(message)
    const { id, offset, length } = message
    const reply = Buffer.alloc(4 + length)
    reply.writeUInt32BE(id)
    source.copy(reply, 4, offset, offset + length)
    socket.send(reply)
  })
  await once(socket, 'message')
  t.after(async () => {
    media.stop()
    socket.terminate()
    server.closeAllConnections()
    await new Promise(resolve => server.close(resolve))
  })
  return { media, session, socket, source, reads, base, url: `${base}/api/browser-media/${session.readToken}/iso` }
}

test('HEAD and random/concurrent ranges reproduce browser bytes without a full upload', async t => {
  const { source, reads, url } = await fixture(t)
  const head = await fetch(url, { method: 'HEAD' })
  assert.equal(head.status, 200)
  assert.equal(Number(head.headers.get('content-length')), source.length)
  assert.equal(reads.length, 0)
  await Promise.all(
    [
      [2048, 8191],
      [0, 511],
      [2000000, 2099999],
    ].map(async ([start, end]) => {
      const res = await fetch(url, { headers: { Range: `bytes=${start}-${end}` } })
      assert.equal(res.status, 206)
      assert.equal(res.headers.get('content-range'), `bytes ${start}-${end}/${source.length}`)
      assert.deepEqual(Buffer.from(await res.arrayBuffer()), source.subarray(start, end + 1))
    })
  )
  assert.equal(reads.length, 3)
})

test('large ranges are split into bounded browser reads', async t => {
  const { url, source, reads } = await fixture(t)
  const res = await fetch(url, { headers: { Range: `bytes=0-${source.length - 1}` } })
  assert.deepEqual(Buffer.from(await res.arrayBuffer()), source)
  assert.equal(reads.length, 3)
  assert.ok(reads.every(read => read.length <= 1024 * 1024))
})

test('rejects invalid ranges and wrong capabilities without reading the browser', async t => {
  const { url, base, session, media, reads } = await fixture(t)
  for (const range of [
    'bytes=-10',
    'bytes=10-1',
    'bytes=9999999999-9999999999',
    'bytes=0-1,4-5',
    'bytes=0-9007199254740993',
  ]) {
    assert.equal((await fetch(url, { headers: { Range: range } })).status, 416)
  }
  assert.equal((await fetch(url)).status, 416)
  assert.equal((await fetch(url, { method: 'POST' })).status, 405)
  assert.equal((await fetch(`${base}/api/browser-media/${session.browserToken}/iso`)).status, 404)
  assert.throws(() => media.get(session.id, 'someone-else'))
  assert.equal(reads.length, 0)
})

test('browser disconnect rejects an outstanding read and revokes the capability', async t => {
  const { media, session, socket, url } = await fixture(t, false)
  const pending = media.read(session, 0, 512)
  const rejected = assert.rejects(pending, /disconnected/)
  socket.close()
  await rejected
  assert.equal(media.sessions.size, 0)
  assert.equal((await fetch(url)).status, 404)
})

test('unresponsive browser has a bounded read timeout', async t => {
  const { media, session } = await fixture(t, false)
  await assert.rejects(media.read(session, 0, 512), /disconnected/)
  assert.equal(session.closed, true)
})

test('malformed browser data fails closed', async t => {
  const { media, session, socket } = await fixture(t, false)
  const pending = assert.rejects(media.read(session, 0, 512), /disconnected/)
  socket.send(Buffer.alloc(8))
  await pending
})

test('clamps ranges beyond EOF and supports open-ended final reads (nbdkit curl)', async t => {
  const { url, source } = await fixture(t)
  const start = source.length - 512
  for (const range of [`bytes=${start}-${source.length}`, `bytes=${start}-`, `bytes=${start}-${source.length + 999}`]) {
    const res = await fetch(url, { headers: { Range: range } })
    assert.equal(res.status, 206)
    assert.equal(res.headers.get('content-range'), `bytes ${start}-${source.length - 1}/${source.length}`)
    assert.deepEqual(Buffer.from(await res.arrayBuffer()), source.subarray(start))
  }
})
