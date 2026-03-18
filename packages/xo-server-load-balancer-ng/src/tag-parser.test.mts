import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import { parseVmTag, getVmConfig } from './tag-parser.mjs'

// ─── parseVmTag ───────────────────────────────────────────────────────────────

describe('parseVmTag', () => {
  describe('non-LB tags', () => {
    it('returns undefined for an unrelated tag', () => {
      assert.equal(parseVmTag('some-tag'), undefined)
    })

    it('returns undefined for an empty string', () => {
      assert.equal(parseVmTag(''), undefined)
    })

    it('returns undefined for a different xo: namespace', () => {
      assert.equal(parseVmTag('xo:other:tag'), undefined)
    })

    it('returns undefined for a prefix-only string', () => {
      assert.equal(parseVmTag('xo:load:balancer:'), undefined)
    })
  })

  describe('ignore tag', () => {
    it('parses the ignore tag', () => {
      assert.deepEqual(parseVmTag('xo:load:balancer:ignore'), { type: 'ignore' })
    })
  })

  describe('affinity tag', () => {
    it('parses a simple affinity tag', () => {
      assert.deepEqual(parseVmTag('xo:load:balancer:affinity=web'), {
        type: 'affinity',
        group: 'web',
      })
    })

    it('preserves spaces in the group name', () => {
      assert.deepEqual(parseVmTag('xo:load:balancer:affinity=my group'), {
        type: 'affinity',
        group: 'my group',
      })
    })

    it('splits on the first = only — group name may contain =', () => {
      assert.deepEqual(parseVmTag('xo:load:balancer:affinity=a=b'), {
        type: 'affinity',
        group: 'a=b',
      })
    })

    it('returns undefined for an empty group name', () => {
      assert.equal(parseVmTag('xo:load:balancer:affinity='), undefined)
    })
  })

  describe('anti-affinity tag', () => {
    it('parses a simple anti-affinity tag', () => {
      assert.deepEqual(parseVmTag('xo:load:balancer:anti-affinity=db'), {
        type: 'anti-affinity',
        group: 'db',
      })
    })

    it('returns undefined for an empty group name', () => {
      assert.equal(parseVmTag('xo:load:balancer:anti-affinity='), undefined)
    })
  })

  describe('unknown sub-keys', () => {
    it('returns undefined for an unknown sub-key with a value', () => {
      assert.equal(parseVmTag('xo:load:balancer:unknown=value'), undefined)
    })

    it('returns undefined for an unknown sub-key without a value', () => {
      assert.equal(parseVmTag('xo:load:balancer:unknown'), undefined)
    })
  })
})

// ─── getVmConfig ──────────────────────────────────────────────────────────────

describe('getVmConfig', () => {
  it('returns ignored:false with empty groups for a VM with no LB tags', () => {
    const config = getVmConfig(['some-tag', 'other-tag'])
    assert.equal(config.ignored, false)
    if (!config.ignored) {
      assert.equal(config.affinityGroups.size, 0)
      assert.equal(config.antiAffinityGroups.size, 0)
    }
  })

  it('returns ignored:false for an empty tag list', () => {
    const config = getVmConfig([])
    assert.equal(config.ignored, false)
  })

  describe('ignore tag', () => {
    it('returns ignored:true when the ignore tag is the only LB tag', () => {
      assert.equal(getVmConfig(['xo:load:balancer:ignore']).ignored, true)
    })

    it('ignore tag short-circuits affinity tags that appear before it', () => {
      assert.equal(getVmConfig(['xo:load:balancer:affinity=web', 'xo:load:balancer:ignore']).ignored, true)
    })

    it('ignore tag short-circuits affinity tags that appear after it', () => {
      assert.equal(getVmConfig(['xo:load:balancer:ignore', 'xo:load:balancer:affinity=web']).ignored, true)
    })
  })

  describe('affinity groups', () => {
    it('collects a single affinity group', () => {
      const config = getVmConfig(['xo:load:balancer:affinity=web'])
      assert.equal(config.ignored, false)
      if (!config.ignored) {
        assert.ok(config.affinityGroups.has('web'))
        assert.equal(config.affinityGroups.size, 1)
      }
    })

    it('collects multiple affinity groups', () => {
      const config = getVmConfig(['xo:load:balancer:affinity=web', 'xo:load:balancer:affinity=db'])
      assert.equal(config.ignored, false)
      if (!config.ignored) {
        assert.ok(config.affinityGroups.has('web'))
        assert.ok(config.affinityGroups.has('db'))
        assert.equal(config.affinityGroups.size, 2)
      }
    })

    it('deduplicates repeated affinity groups', () => {
      const config = getVmConfig(['xo:load:balancer:affinity=web', 'xo:load:balancer:affinity=web'])
      assert.equal(config.ignored, false)
      if (!config.ignored) {
        assert.equal(config.affinityGroups.size, 1)
      }
    })
  })

  describe('anti-affinity groups', () => {
    it('collects a single anti-affinity group', () => {
      const config = getVmConfig(['xo:load:balancer:anti-affinity=frontend'])
      assert.equal(config.ignored, false)
      if (!config.ignored) {
        assert.ok(config.antiAffinityGroups.has('frontend'))
        assert.equal(config.antiAffinityGroups.size, 1)
      }
    })

    it('collects multiple anti-affinity groups', () => {
      const config = getVmConfig(['xo:load:balancer:anti-affinity=frontend', 'xo:load:balancer:anti-affinity=backend'])
      assert.equal(config.ignored, false)
      if (!config.ignored) {
        assert.ok(config.antiAffinityGroups.has('frontend'))
        assert.ok(config.antiAffinityGroups.has('backend'))
      }
    })
  })

  describe('mixed tags', () => {
    it('collects both affinity and anti-affinity groups', () => {
      const config = getVmConfig([
        'xo:load:balancer:affinity=web',
        'xo:load:balancer:anti-affinity=db',
        'unrelated-tag',
      ])
      assert.equal(config.ignored, false)
      if (!config.ignored) {
        assert.ok(config.affinityGroups.has('web'))
        assert.ok(config.antiAffinityGroups.has('db'))
      }
    })

    it('silently ignores unknown LB sub-keys', () => {
      const config = getVmConfig(['xo:load:balancer:unknown=value'])
      assert.equal(config.ignored, false)
      if (!config.ignored) {
        assert.equal(config.affinityGroups.size, 0)
        assert.equal(config.antiAffinityGroups.size, 0)
      }
    })
  })
})
