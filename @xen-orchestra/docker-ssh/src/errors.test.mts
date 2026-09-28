import assert from 'node:assert/strict'
import test from 'node:test'

import {
  DOCKER_SOCKET_UNREACHABLE,
  DockerError,
  fromSshError,
  scrub,
  SSH_AUTH_FAILED,
  SSH_ERROR,
  SSH_UNREACHABLE,
  STREAM_LOCAL_FORWARDING_DISABLED,
  STREAM_LOCAL_UNSUPPORTED,
  TIMEOUT,
} from './errors.mjs'

const { describe, it } = test

function sshError(message: string, props: object) {
  return Object.assign(new Error(message), props)
}

describe('fromSshError()', () => {
  const cases: [string, Error, string][] = [
    [
      'auth failure',
      sshError('All configured authentication methods failed', { level: 'client-authentication' }),
      SSH_AUTH_FAILED,
    ],
    [
      'socket error',
      sshError('connect ECONNREFUSED 127.0.0.1:1', { level: 'client-socket', code: 'ECONNREFUSED' }),
      SSH_UNREACHABLE,
    ],
    ['ready timeout', sshError('Timed out while waiting for handshake', { level: 'client-timeout' }), SSH_UNREACHABLE],
    ['DNS error', sshError('getaddrinfo ENOTFOUND foo', { level: 'client-dns', code: 'ENOTFOUND' }), SSH_UNREACHABLE],
    [
      'administratively prohibited',
      sshError('(SSH) Channel open failure: ', { reason: 1 }),
      STREAM_LOCAL_FORWARDING_DISABLED,
    ],
    ['connect failed', sshError('(SSH) Channel open failure: open failed', { reason: 2 }), DOCKER_SOCKET_UNREACHABLE],
    [
      'channel closed',
      sshError('(SSH) Channel open failure: server closed channel unexpectedly', { reason: '' }),
      SSH_ERROR,
    ],
    [
      'strict vendor',
      new Error('strictVendor enabled and server is not OpenSSH or compatible version'),
      STREAM_LOCAL_UNSUPPORTED,
    ],
    ['AbortError', new DOMException('This operation was aborted', 'AbortError'), TIMEOUT],
    ['TimeoutError', new DOMException('The operation was aborted due to timeout', 'TimeoutError'), TIMEOUT],
    ['handshake error', sshError('Host denied (verification failed)', { level: 'handshake' }), SSH_ERROR],
    ['unknown', new Error('something'), SSH_ERROR],
  ]
  for (const [name, error, code] of cases) {
    it(`maps ${name} to ${code}`, () => {
      const result = fromSshError(error, { host: 'h', port: 22 })
      assert.ok(result instanceof DockerError)
      assert.equal(result.code, code)
      assert.equal(result.data!.host, 'h')
      assert.equal(result.cause!.message, error.message)
    })
  }

  it('keeps the channel open failure details', () => {
    const result = fromSshError(sshError('(SSH) Channel open failure: open failed', { reason: 2 }))
    assert.equal(result.data!.reason, 2)
    assert.equal(result.data!.description, 'open failed')
    assert.equal(result.cause!.reason, 2)
  })

  it('returns DockerError as is', () => {
    const error = new DockerError(TIMEOUT, 'foo')
    assert.equal(fromSshError(error), error)
  })

  it('does not leak credentials attached to the original error', () => {
    const error = sshError('All configured authentication methods failed', {
      level: 'client-authentication',
      config: { password: 'hunter2', privateKey: 'KEY' },
      password: 'hunter2',
    })
    // the context is not supposed to contain credentials
    const result = fromSshError(error, { host: 'h', password: 'hunter2', privateKey: 'KEY' } as { host: string })
    const serialized = JSON.stringify({ data: result.data, cause: result.cause, ...result.cause })
    assert.doesNotMatch(serialized, /hunter2|KEY/)
    assert.equal(result.cause!.config, undefined)
    assert.equal(result.cause!.password, undefined)
    assert.equal(result.cause!.level, 'client-authentication')
  })
})

describe('scrub()', () => {
  it('removes sensitive keys recursively', () => {
    assert.deepEqual(
      scrub({ a: 1, password: 'x', nested: { privateKey: 'y', passphrase: 'z', b: [{ password: 1, c: 2 }] } }),
      {
        a: 1,
        nested: { b: [{ c: 2 }] },
      }
    )
  })
})

describe('DockerError', () => {
  it('has code, data and a sanitized cause', () => {
    const cause = Object.assign(new Error('boom'), { code: 'ECONNRESET', password: 'secret' })
    const error = new DockerError(SSH_ERROR, 'msg', { data: { host: 'h', password: 'secret' }, cause })
    assert.equal(error.name, 'DockerError')
    assert.equal(error.code, SSH_ERROR)
    assert.deepEqual(error.data, { host: 'h' })
    assert.equal(error.cause!.code, 'ECONNRESET')
    assert.equal(error.cause!.password, undefined)
  })
})
