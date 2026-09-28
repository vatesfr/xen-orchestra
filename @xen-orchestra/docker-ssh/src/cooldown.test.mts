import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { SshCooldown } from './cooldown.mjs'
import {
  DOCKER_SOCKET_UNREACHABLE,
  DockerError,
  HOST_KEY_UNKNOWN,
  SSH_AUTH_FAILED,
  SSH_COOLDOWN,
  SSH_ERROR,
  SSH_REFUSED_PENALTY,
  SSH_UNREACHABLE,
} from './errors.mjs'

const createClock = (start = 1e6) => {
  const clock = () => clock.time
  clock.time = start
  return clock
}

const authFailed = () => new DockerError(SSH_AUTH_FAILED, 'SSH authentication failed')
const lostHandshake = () =>
  new DockerError(SSH_ERROR, 'SSH error', { cause: new Error('Connection lost before handshake') })

describe('SshCooldown', () => {
  it('refuses the same identity for the cooldown after an authentication failure, not another one', () => {
    const now = createClock()
    const cooldown = new SshCooldown({ cooldown: 10e3, now })
    const keys = ['engine:a', 'target:h:22']
    assert.equal(cooldown.onFailure(keys, 'id1', authFailed()).code, SSH_AUTH_FAILED)

    now.time += 4e3
    assert.throws(
      () => cooldown.check(keys, 'id1'),
      (error: DockerError) => {
        assert.equal(error.code, SSH_COOLDOWN)
        assert.equal(error.data!.lastCode, SSH_AUTH_FAILED)
        assert.equal(error.data!.retryAfter, 6)
        assert.equal(error.data!.retryAt, 1e6 + 10e3)
        return true
      }
    )
    // same address, other engine, same identity: refused through the target key
    assert.throws(() => cooldown.check(['engine:b', 'target:h:22'], 'id1'), { code: SSH_COOLDOWN })
    // parameters changed: allowed
    cooldown.check(keys, 'id2')

    now.time += 6e3
    cooldown.check(keys, 'id1')
  })

  it('only authentication, host key and handshake failures arm it, and not the fail-fast copies', () => {
    const cooldown = new SshCooldown({ now: createClock() })
    for (const code of [SSH_UNREACHABLE, DOCKER_SOCKET_UNREACHABLE]) {
      cooldown.onFailure(['k'], 'id', new DockerError(code, code))
    }
    cooldown.onFailure(['k'], 'id', new DockerError(SSH_AUTH_FAILED, 'x', { data: { failFast: true } }))
    cooldown.onFailure(['k'], 'id', new Error('not a DockerError'))
    cooldown.check(['k'], 'id')

    cooldown.onFailure(['k'], 'id', new DockerError(HOST_KEY_UNKNOWN, 'unknown'))
    assert.throws(() => cooldown.check(['k'], 'id'), { code: SSH_COOLDOWN })
  })

  it('a success clears it', () => {
    const cooldown = new SshCooldown({ now: createClock() })
    cooldown.onFailure(['k'], 'id', authFailed())
    cooldown.clear(['k'])
    cooldown.check(['k'], 'id')
  })

  it('cooldown 0 disables the refusal', () => {
    const cooldown = new SshCooldown({ cooldown: 0, now: createClock() })
    cooldown.onFailure(['k'], 'id', authFailed())
    cooldown.check(['k'], 'id')
  })

  it('a handshake lost soon after failures → SSH_REFUSED_PENALTY with a hint, not without history', () => {
    const now = createClock()
    const cooldown = new SshCooldown({ cooldown: 0, penaltyWindow: 60e3, now })

    // no history: kept as is
    assert.equal(cooldown.onFailure(['target:h:22'], 'id', lostHandshake()).code, SSH_ERROR)
    now.time += 61e3

    cooldown.onFailure(['target:h:22'], 'id', authFailed())
    now.time += 30e3
    const error = cooldown.onFailure(['target:h:22', 'engine:x'], 'other', lostHandshake())
    assert.equal(error.code, SSH_REFUSED_PENALTY)
    assert.match(error.message, /temporarily refusing this address \(OpenSSH PerSourcePenalties\)/)
    assert.equal(error.cause!.message, 'Connection lost before handshake')

    // outside the window
    now.time += 61e3
    assert.equal(cooldown.onFailure(['target:h:22'], 'id', lostHandshake()).code, SSH_ERROR)
  })

  it('prunes the expired entries', () => {
    const now = createClock()
    const cooldown = new SshCooldown({ cooldown: 1e3, penaltyWindow: 5e3, now })
    cooldown.onFailure(['a', 'b'], 'id', authFailed())
    assert.equal(cooldown.size, 2)
    now.time += 5e3
    cooldown.check(['c'], 'id')
    assert.equal(cooldown.size, 0)
  })
})
