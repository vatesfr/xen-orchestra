import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { describe, it } from 'node:test'

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
    owner: 'user-id',
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
  it('announces its id, then serves reads from the replies of the browser', async () => {
    const { session, socket } = makeSession()
    assert.deepEqual(socket.sent, [{ session: session.id }])

    const read = session.read(1024, 4)
    assert.deepEqual(socket.sent[1], { id: 0, offset: 1024, length: 4 })
    socket.reply(0, Buffer.from('ISO!'))

    assert.deepEqual(await read, Buffer.from('ISO!'))
    assert.equal(session.bytesRead, 4)
    assert.ok(session.lastReadAt > 0)
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
    const { closed, session } = makeSession({ timeout: 20 })
    await assert.rejects(session.read(0, 512), /disconnected/)
    assert.deepEqual(closed, [session])
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
    const { closed, session } = makeSession({ timeout: 10 })
    await new Promise(resolve => setTimeout(resolve, 20))
    session.heartbeat()
    assert.deepEqual(closed, [session])
  })
})
