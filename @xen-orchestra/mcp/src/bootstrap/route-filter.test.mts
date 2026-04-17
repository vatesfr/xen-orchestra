import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { isExcludedRoute, EXCLUDED_ROUTES } from './route-filter.mjs'

describe('route-filter', () => {
  describe('isExcludedRoute', () => {
    it('excludes stats endpoints', () => {
      assert.ok(isExcludedRoute('/pools/{id}/stats'))
      assert.ok(isExcludedRoute('/hosts/{id}/stats'))
      assert.ok(isExcludedRoute('/vms/{id}/stats'))
    })

    it('excludes binary download endpoints', () => {
      assert.ok(isExcludedRoute('/backup-archives/{id}.tgz'))
      assert.ok(isExcludedRoute('/vdis/{id}.raw'))
      assert.ok(isExcludedRoute('/backup-logs/{id}.txt'))
    })

    it('does not exclude regular endpoints', () => {
      assert.strictEqual(isExcludedRoute('/pools'), undefined)
      assert.strictEqual(isExcludedRoute('/pools/{id}'), undefined)
      assert.strictEqual(isExcludedRoute('/pools/{id}/dashboard'), undefined)
      assert.strictEqual(isExcludedRoute('/vms/{id}/actions/start'), undefined)
    })

    it('does not false-match paths containing "stats" as a segment prefix', () => {
      // Only trailing /stats is excluded — guard against drift.
      assert.strictEqual(isExcludedRoute('/stats-report'), undefined)
      assert.strictEqual(isExcludedRoute('/pools/{id}/stats-summary'), undefined)
    })
  })

  describe('EXCLUDED_ROUTES', () => {
    it('each entry carries a non-empty reason', () => {
      for (const rule of EXCLUDED_ROUTES) {
        assert.ok(rule.reason.length > 0, `empty reason for ${rule.pathPattern}`)
      }
    })
  })
})
