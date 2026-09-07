import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { EventEmitter, once } from 'node:events'
import { setImmediate as flush } from 'node:timers/promises'

import { VimClient } from './VimClient.mjs'

class FakeSoapClient extends EventEmitter {
  constructor({ status = 'ready' } = {}) {
    super()
    this.status = status
    this.sessionManager = 'SessionManager'
    this.serviceContent = { propertyCollector: 'propertyCollector' }
    this.calls = []
  }

  runCommand(command, args) {
    const emitter = new EventEmitter()
    this.calls.push({ command, args, emitter })
    return emitter
  }

  get lastCall() {
    return this.calls[this.calls.length - 1]
  }
}

const makeClient = (options = {}) => {
  const client = new FakeSoapClient(options)
  return { client, vimClient: new VimClient('host', 'user', 'password', true, { ...options, client }) }
}

describe('VimClient', function () {
  describe('connect', function () {
    it('resolves immediately when the client is already connected', async function () {
      const { vimClient } = makeClient()
      await vimClient.connect()
    })

    it('waits for the ready event', async function () {
      const { client, vimClient } = makeClient({ status: 'connecting' })
      const promise = vimClient.connect()
      client.emit('ready')
      await promise
    })

    it('rejects with the connection error', async function () {
      const { client, vimClient } = makeClient({ status: 'connecting' })
      const error = new Error('login failed')
      const promise = vimClient.connect()
      client.emit('error', error)
      await assert.rejects(promise, /login failed/)
    })

    it('does not memoize a failed connection', async function () {
      const { client, vimClient } = makeClient({ status: 'connecting' })
      const first = vimClient.connect()
      client.emit('error', new Error('login failed'))
      await assert.rejects(first, /login failed/)

      // the client is disconnected, connecting again must trigger a new attempt
      client.status = 'disconnected'
      const connecting = once(client, 'connect')
      const second = vimClient.connect()
      await connecting
      client.status = 'ready'
      client.emit('ready')

      await second
      assert.notEqual(first, second)
    })

    it('is memoized', async function () {
      const { client, vimClient } = makeClient()
      assert.equal(vimClient.connect(), vimClient.connect())
      // no listener is left on the client, besides the one forwarding errors
      assert.equal(client.listenerCount('ready'), 0)
    })
  })

  describe('call', function () {
    it('resolves with the result of the call', async function () {
      const { client, vimClient } = makeClient()
      const promise = vimClient.call('PowerOffVM_Task', { _this: 'vm-1' })

      await flush() // let the call go through the awaited connection
      const { command, args, emitter } = client.lastCall
      assert.equal(command, 'PowerOffVM_Task')
      assert.deepEqual(args, { _this: 'vm-1' })
      emitter.emit('result', { returnval: { $value: 'task-1' } })

      assert.deepEqual(await promise, { returnval: { $value: 'task-1' } })
    })

    it('rejects with the error of its own call', async function () {
      const { client, vimClient } = makeClient()
      const promise = vimClient.call('Whatever')

      await flush()
      client.lastCall.emitter.emit('error', new Error('InvalidDeviceSpec'))

      await assert.rejects(promise, /InvalidDeviceSpec/)
    })

    it('is not disturbed by the failure of a concurrent call', async function () {
      const { client, vimClient } = makeClient()
      const failing = vimClient.call('Failing')
      const succeeding = vimClient.call('Succeeding')

      await flush()
      const [first, second] = client.calls
      first.emitter.emit('error', new Error('nope'))
      second.emitter.emit('result', 'ok')

      await assert.rejects(failing, /nope/)
      assert.equal(await succeeding, 'ok')
    })

    it('does not leak listeners', async function () {
      const { client, vimClient } = makeClient()

      for (let i = 0; i < 20; i++) {
        const promise = vimClient.call(`Call${i}`)
        await flush()
        const { emitter } = client.lastCall
        if (i % 2 === 0) {
          emitter.emit('result', i)
          assert.equal(await promise, i)
        } else {
          emitter.emit('error', new Error(`error ${i}`))
          await assert.rejects(promise)
        }
        assert.equal(emitter.listenerCount('result'), 0)
        assert.equal(emitter.listenerCount('error'), 0)
      }

      // the only listener on the client is the one forwarding its errors
      assert.equal(client.listenerCount('error'), 1)
      assert.equal(client.listenerCount('result'), 0)
    })

    it('rejects when the server does not answer', async function () {
      const { vimClient } = makeClient()
      await assert.rejects(vimClient.call('Silent', undefined, { timeout: 1 }), { name: 'TimeoutError' })
    })
  })

  describe('close', function () {
    it('logs out', async function () {
      const { client, vimClient } = makeClient()
      const promise = vimClient.close()

      await flush()
      assert.equal(client.lastCall.command, 'Logout')
      assert.deepEqual(client.lastCall.args, { _this: 'SessionManager' })
      client.lastCall.emitter.emit('result', {})

      await promise
    })

    it('does nothing when not connected', async function () {
      const { client, vimClient } = makeClient({ status: 'disconnected' })
      await vimClient.close()
      assert.equal(client.calls.length, 0)
    })

    it('does not throw when the logout fails', async function () {
      const { client, vimClient } = makeClient()
      const promise = vimClient.close()

      await flush()
      client.lastCall.emitter.emit('error', new Error('session already gone'))

      await promise
    })
  })

  it('forwards the errors raised once connected', async function () {
    const client = new FakeSoapClient()
    const errors = []
    // eslint-disable-next-line no-new
    new VimClient('host', 'user', 'password', true, { client, onError: error => errors.push(error) })

    const error = new Error('session expired')
    client.emit('error', error)

    assert.deepEqual(errors, [error])
  })
})
