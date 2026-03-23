import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import type { StringValue } from 'ms'

import { parseConfig } from './_loadConfig.mjs'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VALID_REMOTE = { root: '/fake/root', immutabilityDuration: '30d' as StringValue }

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('parseConfig', () => {
  it('throws when remotes key is absent', () => {
    assert.throws(() => parseConfig({ liftEvery: '1h' } as any), /No remotes are configured/)
  })

  it('throws when a remote is missing the root property', () => {
    assert.throws(
      () => parseConfig({ liftEvery: '1h', remotes: { myRemote: { immutabilityDuration: '30d' } } }),
      /don't have a root property/
    )
  })

  it('throws when a remote is missing immutabilityDuration', () => {
    assert.throws(
      () => parseConfig({ liftEvery: '1h', remotes: { myRemote: { root: '/fake/root' } } }),
      /don't have a immutabilityDuration/
    )
  })

  it('throws when immutabilityDuration is shorter than 1 day', () => {
    assert.throws(
      () =>
        parseConfig({ liftEvery: '1h', remotes: { myRemote: { root: '/fake/root', immutabilityDuration: '23h' } } }),
      /smaller than the minimum/
    )
  })

  // --- liftEvery validation ---

  it('throws when liftEvery is a number', () => {
    assert.throws(
      () => parseConfig({ liftEvery: 3600 as any, remotes: { myRemote: VALID_REMOTE } }),
      /must be a string for liftEvery/
    )
  })

  it('throws when liftEvery is an unparsable string', () => {
    assert.throws(
      () => parseConfig({ liftEvery: 'notaduration' as any, remotes: { myRemote: VALID_REMOTE } }),
      /is not a valid value for entry liftEvery/
    )
  })

  // --- immutabilityDuration validation ---

  it('throws when immutabilityDuration is a number', () => {
    assert.throws(
      () =>
        parseConfig({
          liftEvery: '1h',
          remotes: { myRemote: { root: '/fake/root', immutabilityDuration: 86400000 as any } },
        }),
      /must be a string for remote myRemote/
    )
  })

  it('throws when immutabilityDuration is an unparsable string', () => {
    assert.throws(
      () =>
        parseConfig({
          liftEvery: '1h',
          remotes: { myRemote: { root: '/fake/root', immutabilityDuration: 'notaduration' as any } },
        }),
      /is not a valid value for entry immutabilityDuration/
    )
  })

  it('parses a valid duration string to milliseconds', () => {
    const config = parseConfig({
      liftEvery: '1h',
      remotes: { myRemote: { root: '/some/path', immutabilityDuration: '30d' } },
    })
    assert.strictEqual(config.remotes['myRemote'].immutabilityDuration, 30 * 24 * 60 * 60 * 1000)
  })

  it('parses liftEvery duration string to milliseconds', () => {
    const config = parseConfig({
      liftEvery: '1h',
      remotes: { myRemote: { root: '/some/path', immutabilityDuration: '7d' } },
    })
    assert.strictEqual(config.liftEvery, 60 * 60 * 1000)
  })
})
