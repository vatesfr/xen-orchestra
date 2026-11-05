import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { describe, it } from 'node:test'

import { _soapErrorHandler } from './client.mjs'

// what a host answers to any call made on a session which expired
const NOT_AUTHENTICATED = {
  root: {
    Envelope: {
      Body: {
        Fault: {
          faultcode: 'ServerFaultCode',
          faultstring: 'The session is not authenticated.',
          detail: { NotAuthenticatedFault: { attributes: { 'xsi:type': 'NotAuthenticated' } } },
        },
      },
    },
  },
}

const FILE_LOCKED = {
  root: {
    Envelope: {
      Body: {
        Fault: {
          faultcode: 'ServerFaultCode',
          faultstring: 'Unable to access file since it is locked',
          detail: { FileLockedFault: { attributes: { 'xsi:type': 'FileLocked' } } },
        },
      },
    },
  },
}

/**
 * A stand-in for a connected `Client`, reduced to what `_soapErrorHandler` touches: building a real
 * one talks to a host.
 *
 * `connect` reproduces `_connect`, which only starts connecting from 'disconnected'.
 */
function fakeClient() {
  const self = new EventEmitter()

  self.status = 'ready'
  self.reconnectCount = 0
  self.unregisterExitHookCalls = 0
  self._unregisterExitHook = () => {
    self.unregisterExitHookCalls += 1
  }

  // the calls handed to `runCommand`, i.e. the ones actually sent to the host
  self.sent = []
  self.runCommand = (command, args) => {
    const emitter = new EventEmitter()
    self.sent.push({ args, command, emitter, statusWhenSent: self.status })
    return emitter
  }

  self.connectCalls = 0
  self.on('connect', () => {
    self.connectCalls += 1
    if (self.status === 'disconnected') {
      self.status = 'connecting'
    }
  })

  return self
}

// makes one in-flight call fail, and reports what its own emitter received
function failingCall(self, command, rawError = NOT_AUTHENTICATED) {
  const emitter = new EventEmitter()
  const outcome = {}
  emitter.once('result', result => {
    outcome.result = result
  })
  emitter.once('error', error => {
    outcome.error = error
  })

  _soapErrorHandler(self, emitter, command, { _this: command }, rawError)

  return outcome
}

describe('_soapErrorHandler', function () {
  it('replays a call made on an expired session, once the new session is ready', function () {
    const self = fakeClient()

    const outcome = failingCall(self, 'RetrievePropertiesEx')

    assert.equal(self.reconnectCount, 1)
    assert.equal(self.status, 'connecting')
    assert.equal(self.unregisterExitHookCalls, 1)
    assert.deepEqual(self.sent, [])

    self.status = 'ready'
    self.emit('ready')

    assert.equal(self.sent.length, 1)
    assert.equal(self.sent[0].command, 'RetrievePropertiesEx')
    self.sent[0].emitter.emit('result', 'replayed')
    assert.equal(outcome.result, 'replayed')
  })

  it('starts a single reconnect for a whole wave of calls on the same session', function () {
    const self = fakeClient()

    const outcomes = [failingCall(self, 'A'), failingCall(self, 'B'), failingCall(self, 'C')]

    // one retry for the wave, not one per call: they used to exhaust the 10 of a busy import
    assert.equal(self.reconnectCount, 1)
    assert.equal(self.connectCalls, 1)
    assert.equal(self.unregisterExitHookCalls, 1)
    // and none of them is sent while the reconnect is in flight, which would mean sending it on
    // the session which just expired
    assert.deepEqual(self.sent, [])

    self.status = 'ready'
    self.emit('ready')

    assert.deepEqual(
      self.sent.map(({ command, statusWhenSent }) => [command, statusWhenSent]),
      [
        ['A', 'ready'],
        ['B', 'ready'],
        ['C', 'ready'],
      ]
    )

    // each replay answers its own caller
    self.sent[1].emitter.emit('result', 'B replayed')
    assert.equal(outcomes[1].result, 'B replayed')
    assert.equal(outcomes[0].result, undefined)
    assert.equal(outcomes[2].result, undefined)
  })

  it('restarts a reconnect which already failed', function () {
    const self = fakeClient()

    failingCall(self, 'A')
    assert.equal(self.connectCalls, 1)

    // the reconnect failed, nothing is in flight any more
    self.status = 'disconnected'

    failingCall(self, 'B')
    assert.equal(self.connectCalls, 2)
    // the session was already dropped by the first call, the second one must not pay for it again
    assert.equal(self.reconnectCount, 1)
  })

  it('reports a failed reconnect to every waiting call, and stops listening', function () {
    const self = fakeClient()

    const outcomes = [failingCall(self, 'A'), failingCall(self, 'B')]

    const connectionError = new Error('host unreachable')
    self.status = 'disconnected'
    self.emit('error', connectionError)

    assert.equal(outcomes[0].error, connectionError)
    assert.equal(outcomes[1].error, connectionError)
    assert.deepEqual(self.sent, [])
    // a listener left behind would replay a call whose caller has long given up
    assert.equal(self.listenerCount('ready'), 0)
    assert.equal(self.listenerCount('error'), 0)
  })

  it('reports the error of a replay which failed too', function () {
    const self = fakeClient()

    const outcome = failingCall(self, 'A')

    self.status = 'ready'
    self.emit('ready')

    const replayError = new Error('failed again')
    self.sent[0].emitter.emit('error', replayError)
    assert.equal(outcome.error, replayError)
  })

  it('gives up after 10 reconnects', function () {
    const self = fakeClient()
    self.reconnectCount = 10

    const outcome = failingCall(self, 'A')

    assert.equal(outcome.error.code, 'NotAuthenticated')
    assert.equal(self.connectCalls, 0)
    assert.equal(self.status, 'ready')
    assert.deepEqual(self.sent, [])
  })

  it('emits an error which is not a session expiry as is, without reconnecting', function () {
    const self = fakeClient()

    const outcome = failingCall(self, 'A', FILE_LOCKED)

    assert.equal(outcome.error.code, 'FileLocked')
    assert.equal(self.connectCalls, 0)
    assert.equal(self.reconnectCount, 0)
    assert.equal(self.status, 'ready')
    assert.deepEqual(self.sent, [])
  })

  it('recognizes an expiry which only says so in its faultstring', function () {
    const self = fakeClient()

    // no `detail`, hence no fault type to branch on
    failingCall(self, 'A', {
      root: { Envelope: { Body: { Fault: { faultstring: 'The session is not authenticated.' } } } },
    })

    assert.equal(self.reconnectCount, 1)
    assert.equal(self.connectCalls, 1)
  })
})
