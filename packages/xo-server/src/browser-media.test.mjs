import assert from 'node:assert/strict'
import { once } from 'node:events'
import { createServer } from 'node:http'
import { test } from 'node:test'
import WebSocket from 'ws'
import { IscsiInitiator } from '@vates/iscsi'
import { BrowserMedia, installBrowserMedia } from './browser-media.mjs'
import { BrowserIsoDevice } from './browser-media-iscsi.mjs'

async function fixture(t, respond = true) {
  const media = new BrowserMedia({ timeout: 1000 })
  media.bindAddress = media.advertisedAddress = '127.0.0.1'
  const server = createServer((req, res) => res.writeHead(404).end())
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
    await media.stop()
    socket.terminate()
    server.closeAllConnections()
    await new Promise(resolve => server.close(resolve))
  })
  return { media, session, socket, source, reads, base, device: new BrowserIsoDevice(media, session) }
}

test('random concurrent block reads reproduce browser bytes without a full upload', async t => {
  const { source, reads, device } = await fixture(t)
  assert.equal(device.getSize(), source.length)
  assert.equal(device.getBlockSize(), 512)
  assert.equal(reads.length, 0)
  await Promise.all(
    [
      [2048, 8192],
      [0, 512],
      [source.length - 512, 512],
    ].map(async ([start, length]) => {
      assert.deepEqual(await device.read(start, length), source.subarray(start, start + length))
    })
  )
  assert.equal(reads.length, 3)
})

test('large block commands are split into bounded browser reads', async t => {
  const { source, reads, device } = await fixture(t)
  assert.deepEqual(await device.read(0, source.length), source)
  assert.equal(reads.length, 3)
  assert.ok(reads.every(read => read.length <= 1024 * 1024))
})

test('invalid, unaligned, excessive and past-EOF reads fail before contacting the browser', async t => {
  const { device, source, reads, media, session } = await fixture(t)
  for (const [offset, length] of [
    [-512, 512],
    [1, 512],
    [0, 513],
    [source.length, 512],
    [0, 16 * 1024 * 1024],
    [Infinity, 512],
  ]) {
    await assert.rejects(device.read(offset, length), /Invalid/)
  }
  assert.deepEqual(await device.read(0, 0), Buffer.alloc(0))
  await assert.rejects(device.write(0, Buffer.alloc(512)), /read-only/)
  assert.throws(() => media.get(session.id, 'someone-else'))
  assert.equal(reads.length, 0)
})

test('browser disconnect rejects an outstanding read and revokes the session', async t => {
  const { media, socket, device } = await fixture(t, false)
  const rejected = assert.rejects(device.read(0, 512), /disconnected/)
  socket.close()
  await rejected
  assert.equal(media.sessions.size, 0)
  await assert.rejects(device.read(0, 512), /disconnected/)
})

test('unresponsive browser has a bounded read timeout', async t => {
  const { device, session } = await fixture(t, false)
  await assert.rejects(device.read(0, 512), /disconnected/)
  assert.equal(session.closed, true)
})

test('malformed browser data fails closed', async t => {
  const { device, socket } = await fixture(t, false)
  const pending = assert.rejects(device.read(0, 512), /disconnected/)
  socket.send(Buffer.alloc(8))
  await pending
})

test('cleanup-pending sessions still consume the session quota', async t => {
  const { media, session } = await fixture(t)
  session.onClose = () => {}
  media.close(session)
  for (let i = 1; i < 16; ++i) media.create({ owner: 'admin', vm: 'vm', name: 'test.iso', size: 32768 })
  assert.throws(() => media.create({ owner: 'admin', vm: 'vm', name: 'test.iso', size: 32768 }), /Too many/)
  media.release(session)
  media.create({ owner: 'admin', vm: 'vm', name: 'test.iso', size: 32768 })
})

test('real CHAP iSCSI target reads the browser relay and reports disconnect as a SCSI error', async t => {
  const { media, session, source, socket } = await fixture(t)
  const target = await media.createTarget(session)
  const dc = target.deviceConfig
  const initiator = new IscsiInitiator({
    messageTimeoutMs: 1000,
    host: dc.target,
    port: Number(dc.port),
    targetIqn: dc.targetIQN,
    chap: { user: dc.chapuser, secret: dc.chappassword },
  })
  t.after(() => initiator.close())
  await initiator.connect()
  assert.equal(initiator.getSize(), source.length)
  assert.deepEqual(await initiator.read(32768, 4096), source.subarray(32768, 36864))
  assert.deepEqual(await initiator.read(source.length - 512, 512), source.subarray(-512))
  socket.close()
  await once(socket, 'close')
  await assert.rejects(initiator.read(65536, 512), /SCSI command failed/)
  await initiator.close()
})

test('opt-in requires an explicitly reachable iSCSI address', t => {
  const previous = process.env.XO_BROWSER_MEDIA_ENABLED
  t.after(() => {
    if (previous === undefined) delete process.env.XO_BROWSER_MEDIA_ENABLED
    else process.env.XO_BROWSER_MEDIA_ENABLED = previous
  })
  process.env.XO_BROWSER_MEDIA_ENABLED = '1'
  assert.throws(() => installBrowserMedia({}, { config: { getOptional: () => undefined } }), /iscsi.advertisedAddress/)
})
