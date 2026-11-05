import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { afterEach, beforeEach, describe, it, mock } from 'node:test'

import { BrowserMediaSession, CLOSE_INVALID, MAX_READ, parseIsoDescription } from './_session.mjs'

// stands for a `ws` WebSocket on the server side
class FakeSocket extends EventEmitter {
  readyState = 1 // OPEN
  sent = []
  closedWith = undefined
  send(data, cb) {
    this.sent.push(JSON.parse(data))
    cb?.()
  }
  ping() {}
  close(code, reason) {
    this.closedWith = [code, reason]
    this.readyState = 3
  }
  terminate() {
    this.closedWith = ['terminated']
    this.readyState = 3
  }
  reply(id, data) {
    const message = Buffer.alloc(4 + data.length)
    message.writeUInt32BE(id, 0)
    data.copy(message, 4)
    this.emit('message', message, true)
  }
}

const makeSession = ({ timeout = 1e3 } = {}) => {
  const socket = new FakeSocket()
  const closed = []
  const session = new BrowserMediaSession({
    socket,
    userId: 'user-id',
    name: 'debian.iso',
    size: 64 * 1024,
    timeout,
    onClose: session => closed.push(session),
  })
  return { closed, session, socket }
}

describe('parseIsoDescription', () => {
  it('accepts a named ISO whose size is a multiple of 512 bytes', () => {
    assert.deepEqual(parseIsoDescription(Buffer.from('{"name":"a.iso","size":65536}'), false), {
      name: 'a.iso',
      size: 65536,
    })
  })

  for (const [what, message] of [
    ['a binary message', [Buffer.alloc(8), true]],
    ['invalid JSON', [Buffer.from('{'), false]],
    ['an empty name', [Buffer.from('{"name":"","size":65536}'), false]],
    ['a size which is not a multiple of 512', [Buffer.from('{"name":"a","size":65537}'), false]],
    ['a size below 32 KiB', [Buffer.from('{"name":"a","size":512}'), false]],
    ['a size which is not a number', [Buffer.from('{"name":"a","size":"65536"}'), false]],
  ]) {
    it(`refuses ${what}`, () => {
      assert.equal(typeof parseIsoDescription(...message), 'string')
    })
  }
})

describe('BrowserMediaSession', () => {
  beforeEach(() => mock.timers.enable({ apis: ['setTimeout', 'Date'] }))
  afterEach(() => mock.timers.reset())

  it('announces its id, then serves reads from the replies of the browser', async () => {
    const { session, socket } = makeSession()
    assert.deepEqual(socket.sent, [{ session: session.id }])

    const read = session.read(1024, 4)
    assert.deepEqual(socket.sent[1], { id: 0, offset: 1024, length: 4 })
    mock.timers.tick(10)
    socket.reply(0, Buffer.from('ISO!'))

    assert.deepEqual(await read, Buffer.from('ISO!'))
    assert.equal(session.bytesRead, 4)
    assert.equal(session.lastReadAt, 10)
  })

  it('closes the session on a reply of the wrong length, and fails the pending reads', async () => {
    const { closed, session, socket } = makeSession()
    const read = session.read(0, 4)
    socket.reply(0, Buffer.from('IS'))

    await assert.rejects(read, /disconnected/)
    assert.deepEqual(socket.closedWith, [CLOSE_INVALID, 'unexpected reply'])
    assert.deepEqual(closed, [session])
  })

  it('closes the session when a read is left unanswered', async () => {
    const { closed, session } = makeSession({ timeout: 1e3 })
    const read = session.read(0, 512)
    mock.timers.tick(999)
    assert.deepEqual(closed, [])
    mock.timers.tick(1)
    await assert.rejects(read, /disconnected/)
    assert.deepEqual(closed, [session])
  })

  it('waits for the pending reads as long as the browser answers some of them', async () => {
    const { closed, session, socket } = makeSession({ timeout: 1e3 })
    const first = session.read(0, 512)
    const second = session.read(512, 512)

    // the second one waits longer than the timeout, but the browser made progress meanwhile
    mock.timers.tick(800)
    socket.reply(0, Buffer.alloc(512))
    await first
    mock.timers.tick(800)
    assert.deepEqual(closed, [])

    // until it stops answering
    mock.timers.tick(200)
    await assert.rejects(second, /disconnected/)
    assert.deepEqual(closed, [session])
  })

  it('does not let a read wait forever while the browser answers the others', async () => {
    const { closed, session, socket } = makeSession({ timeout: 1e3 })
    const starved = session.read(0, 512)
    starved.catch(() => {})
    // 16 × timeout: as long as the 16 reads the browser can be asked at once may take at that pace
    for (let i = 0; i < 20 && !session.closed; ++i) {
      const read = session.read(512, 512)
      read.catch(() => {}) // fails if the session closes meanwhile
      mock.timers.tick(900)
      if (!session.closed) {
        socket.reply(socket.sent.at(-1).id, Buffer.alloc(512))
        await read
      }
    }
    assert.deepEqual(closed, [session])
    // closed at 16 × timeout, not before
    assert.equal(Date.now(), 16e3 + 200)
    await assert.rejects(starved, /disconnected/)
  })

  it('does not extend the wait of the pending reads with new reads', async () => {
    const { closed, session } = makeSession({ timeout: 1e3 })
    const reads = [session.read(0, 512)]
    for (let i = 0; i < 5; ++i) {
      mock.timers.tick(500)
      if (!session.closed) {
        reads.push(session.read(512, 512))
      }
    }
    // nothing answered since the first read
    assert.deepEqual(closed, [session])
    for (const read of reads) {
      await assert.rejects(read, /disconnected/)
    }
  })

  it('does not close an idle session once its reads are answered', async () => {
    const { closed, session, socket } = makeSession({ timeout: 1e3 })
    const read = session.read(0, 512)
    socket.reply(0, Buffer.alloc(512))
    await read
    mock.timers.tick(5e3)
    assert.deepEqual(closed, [])
  })

  it('refuses reads past the end of the ISO or longer than a browser read', async () => {
    const { session } = makeSession()
    await assert.rejects(session.read(64 * 1024 - 512, 1024), /invalid read/)
    await assert.rejects(session.read(0, MAX_READ + 1), /invalid read/)
  })

  it('fails reads once closed', async () => {
    const { session } = makeSession()
    session.close()
    await assert.rejects(session.read(0, 512), /disconnected/)
  })

  it('closes the session when the browser misses its heartbeats', async () => {
    const { closed, session } = makeSession({ timeout: 1e3 })
    mock.timers.tick(1e3)
    session.heartbeat()
    assert.deepEqual(closed, [])
    mock.timers.tick(1)
    session.heartbeat()
    assert.deepEqual(closed, [session])
  })
})
