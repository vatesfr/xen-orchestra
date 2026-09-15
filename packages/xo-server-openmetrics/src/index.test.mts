/**
 * Tests for the plugin configuration (Prometheus secret handling)
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { configurationSchema, ensureSecret } from './index.mjs'

describe('configurationSchema', () => {
  it('does not generate the secret as a schema default', () => {
    // a `default` here is re-evaluated on every module load and never persisted
    // by xo-server, which used to change the Prometheus secret at each restart
    assert.equal((configurationSchema.properties.secret as Record<string, unknown>).default, undefined)
  })
})

describe('ensureSecret', () => {
  it('generates and persists a secret when none is configured', async () => {
    const persisted: unknown[] = []
    const secret = await ensureSecret(undefined, async configuration => {
      persisted.push(configuration)
    })

    assert.match(secret, /^[0-9a-f]{64}$/)
    assert.deepEqual(persisted, [{ secret }])
  })

  it('generates and persists a secret when the configured one is empty', async () => {
    const persisted: unknown[] = []
    const secret = await ensureSecret({ secret: '' }, async configuration => {
      persisted.push(configuration)
    })

    assert.match(secret, /^[0-9a-f]{64}$/)
    assert.deepEqual(persisted, [{ secret }])
  })

  it('keeps the configured secret and persists nothing', async () => {
    const persisted: unknown[] = []
    const secret = await ensureSecret({ secret: 'cafecafecafecafe' }, async configuration => {
      persisted.push(configuration)
    })

    assert.equal(secret, 'cafecafecafecafe')
    assert.deepEqual(persisted, [])
  })
})
