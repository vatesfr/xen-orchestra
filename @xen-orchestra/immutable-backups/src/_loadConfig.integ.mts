import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { parseConfig } from './_loadConfig.mjs'

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('parseConfig', () => {
  it('throws when remotes key is absent', () => {
    assert.throws(() => parseConfig({}), /No remotes are configured/)
  })

  it('throws when a remote is missing the root property', () => {
    assert.throws(
      () => parseConfig({ remotes: { myRemote: { immutabilityDuration: '30d' } } }),
      /don't have a root property/
    )
  })

  it('throws when a remote is missing immutabilityDuration', () => {
    assert.throws(
      () => parseConfig({ remotes: { myRemote: { root: '/fake/root' } } }),
      /don't have a immutabilityDuration/
    )
  })

  it('throws when immutabilityDuration is shorter than 1 day', () => {
    assert.throws(
      () => parseConfig({ remotes: { myRemote: { root: '/fake/root', immutabilityDuration: '23h' } } }),
      /smaller than the minimum/
    )
  })

  it('parses a valid duration string to milliseconds', () => {
    const config = parseConfig({
      remotes: { myRemote: { root: '/some/path', immutabilityDuration: '30d' } },
    })
    assert.strictEqual(config.remotes['myRemote'].immutabilityDuration, 30 * 24 * 60 * 60 * 1000)
  })

  it('parses optional liftEvery duration string to milliseconds', () => {
    const config = parseConfig({
      liftEvery: '1h',
      remotes: { myRemote: { root: '/some/path', immutabilityDuration: '7d' } },
    })
    assert.strictEqual(config.liftEvery, 60 * 60 * 1000)
  })
})
