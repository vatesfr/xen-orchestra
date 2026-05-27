/**
 * Tests for OpenMetrics Formatter Module
 *
 * Covers the `indexSrUuidTruncations` helper exported from `index.mts`. The
 * XOSTOR formatters are tested under `./xostor/formatters.test.mts`; the
 * RRD/entity/primitive/definition formatters under `./formatter/*.test.mts`.
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { indexSrUuidTruncations } from './index.mjs'

// ============================================================================
// indexSrUuidTruncations Tests
// ============================================================================

describe('indexSrUuidTruncations', () => {
  it('should index both UUID prefix and suffix at all configured lengths', () => {
    const uuid = 'c787b75c-3e0d-70fa-d0c3-cbfd382d7e33'
    const index: Record<string, string> = {}

    indexSrUuidTruncations(uuid, index)

    // XCP-ng's typical 8-char prefix (the reason the bug existed)
    assert.equal(index[uuid.slice(0, 8)], uuid)
    // 8-char suffix (legacy / variant builds)
    assert.equal(index[uuid.slice(-8)], uuid)
    // 12, 16, 20 truncations also indexed at both ends
    for (const len of [12, 16, 20]) {
      assert.equal(index[uuid.slice(0, len)], uuid)
      assert.equal(index[uuid.slice(-len)], uuid)
    }
  })

  it('should not overwrite existing entries (first match wins)', () => {
    const uuid = 'c787b75c-3e0d-70fa-d0c3-cbfd382d7e33'
    const prefix = uuid.slice(0, 8)
    const index: Record<string, string> = { [prefix]: 'first-sr-uuid' }

    indexSrUuidTruncations(uuid, index)

    assert.equal(index[prefix], 'first-sr-uuid')
  })

  it('should skip truncations longer than the UUID itself', () => {
    const shortUuid = 'abc1234'
    const index: Record<string, string> = {}

    indexSrUuidTruncations(shortUuid, index)

    // 8/12/16/20 are all longer than the 7-char input
    assert.equal(Object.keys(index).length, 0)
  })
})
