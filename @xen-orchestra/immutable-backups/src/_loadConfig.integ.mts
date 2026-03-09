import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { homedir } from 'node:os'

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
      remotes: { myRemote: { root: '/some/path', immutabilityDuration: '30d', indexPath: '/tmp/index' } },
    })
    assert.strictEqual(config.remotes['myRemote'].immutabilityDuration, 30 * 24 * 60 * 60 * 1000)
  })

  it('parses optional liftEvery duration string to milliseconds', () => {
    const config = parseConfig({
      liftEvery: '1h',
      remotes: { myRemote: { root: '/some/path', immutabilityDuration: '7d', indexPath: '/tmp/idx' } },
    })
    assert.strictEqual(config.liftEvery, 60 * 60 * 1000)
  })

  it('preserves explicit indexPath', () => {
    const explicitIndex = '/explicit/index/path'
    const config = parseConfig({
      remotes: { myRemote: { root: '/some/path', immutabilityDuration: '14d', indexPath: explicitIndex } },
    })
    assert.strictEqual(config.remotes['myRemote'].indexPath, explicitIndex)
  })

  it('derives indexPath from XDG_DATA_HOME when indexPath is absent', () => {
    const origData = process.env.XDG_DATA_HOME
    const fakeDataHome = '/tmp/fake-xdg-data'
    process.env.XDG_DATA_HOME = fakeDataHome
    try {
      const config = parseConfig({
        remotes: { myRemote: { root: '/some/path', immutabilityDuration: '7d' } },
      })
      assert.strictEqual(
        config.remotes['myRemote'].indexPath,
        path.join(fakeDataHome, 'xo-immutable-backups', 'myRemote')
      )
    } finally {
      if (origData === undefined) {
        delete process.env.XDG_DATA_HOME
      } else {
        process.env.XDG_DATA_HOME = origData
      }
    }
  })

  it('derives indexPath from homedir when XDG_DATA_HOME is absent', () => {
    const origData = process.env.XDG_DATA_HOME
    delete process.env.XDG_DATA_HOME
    try {
      const config = parseConfig({
        remotes: { myRemote: { root: '/some/path', immutabilityDuration: '7d' } },
      })
      assert.strictEqual(
        config.remotes['myRemote'].indexPath,
        path.join(homedir(), '.local', 'share', 'xo-immutable-backups', 'myRemote')
      )
    } finally {
      if (origData !== undefined) {
        process.env.XDG_DATA_HOME = origData
      }
    }
  })
})
