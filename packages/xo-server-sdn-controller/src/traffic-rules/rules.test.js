import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'
import {
  LEGACY_PRIORITY,
  BANDS,
  LEGACY_COOKIE,
  toEntryFields,
  sameMatch,
  sameRule,
  generateCookie,
  bandOf,
  appendPriority,
  planRewrite,
  parseList,
  serializeCopy,
} from './rules.js'

describe('rules', () => {
  describe('toEntryFields', () => {
    it('lowercases mac and converts port to number', () => {
      const entry = toEntryFields({
        mac: 'AA:BB:CC:DD:EE:FF',
        allow: true,
        protocol: 'TCP',
        port: '22',
        ipRange: '10.0.0.0/24',
        direction: 'to',
      })
      assert.strictEqual(entry.mac, 'aa:bb:cc:dd:ee:ff')
      assert.strictEqual(entry.port, 22)
    })

    it('omits port when null or empty string', () => {
      const entryNull = toEntryFields({
        allow: true,
        protocol: 'TCP',
        port: null,
        ipRange: '10.0.0.0/24',
        direction: 'to',
      })
      assert(!('port' in entryNull))

      const entryEmpty = toEntryFields({
        allow: true,
        protocol: 'TCP',
        port: '',
        ipRange: '10.0.0.0/24',
        direction: 'to',
      })
      assert(!('port' in entryEmpty))
    })

    it('omits mac when absent or null', () => {
      const entryNoMac = toEntryFields({
        allow: true,
        protocol: 'TCP',
        ipRange: '10.0.0.0/24',
        direction: 'to',
      })
      assert(!('mac' in entryNoMac))

      const entryNullMac = toEntryFields({
        mac: null,
        allow: true,
        protocol: 'TCP',
        ipRange: '10.0.0.0/24',
        direction: 'to',
      })
      assert(!('mac' in entryNullMac))
    })

    it('defaults ipRange to empty string', () => {
      const entry = toEntryFields({
        allow: true,
        protocol: 'TCP',
        direction: 'to',
      })
      assert.strictEqual(entry.ipRange, '')
    })

    it('has correct key order for full VIF rule', () => {
      const entry = toEntryFields({
        mac: 'aa:bb:cc:dd:ee:ff',
        allow: true,
        protocol: 'TCP',
        port: 22,
        ipRange: '10.0.0.0/24',
        direction: 'to',
      })
      assert.deepStrictEqual(Object.keys(entry), ['mac', 'allow', 'protocol', 'port', 'ipRange', 'direction'])
    })
  })

  describe('sameMatch', () => {
    it('is true for different protocol cases', () => {
      const a = { direction: 'to', ipRange: '', protocol: 'TCP', port: 22 }
      const b = { direction: 'to', ipRange: '', protocol: 'tcp', port: 22 }
      assert(sameMatch(a, b))
    })

    it('is true for port as string vs number', () => {
      const a = { direction: 'to', ipRange: '', protocol: 'TCP', port: 22 }
      const b = { direction: 'to', ipRange: '', protocol: 'TCP', port: '22' }
      assert(sameMatch(a, b))
    })

    it('is true for different allow values', () => {
      const a = { allow: true, direction: 'to', ipRange: '', protocol: 'TCP', port: 22 }
      const b = { allow: false, direction: 'to', ipRange: '', protocol: 'TCP', port: 22 }
      assert(sameMatch(a, b))
    })

    it('is false for different MACs', () => {
      const a = { mac: 'aa:bb:cc:dd:ee:ff', direction: 'to', ipRange: '', protocol: 'TCP', port: 22 }
      const b = { mac: 'aa:bb:cc:dd:ee:fe', direction: 'to', ipRange: '', protocol: 'TCP', port: 22 }
      assert(!sameMatch(a, b))
    })

    it('is false for VIF rule vs network-wide rule with same fields', () => {
      const a = { mac: 'aa:bb:cc:dd:ee:ff', direction: 'to', ipRange: '', protocol: 'TCP', port: 22 }
      const b = { direction: 'to', ipRange: '', protocol: 'TCP', port: 22 }
      assert(!sameMatch(a, b))
    })
  })

  describe('sameRule', () => {
    it('is false when only allow differs', () => {
      const a = { allow: true, direction: 'to', ipRange: '', protocol: 'TCP', port: 22 }
      const b = { allow: false, direction: 'to', ipRange: '', protocol: 'TCP', port: 22 }
      assert(!sameRule(a, b))
    })

    it('is true when match and allow are the same', () => {
      const a = { allow: true, direction: 'to', ipRange: '', protocol: 'TCP', port: 22 }
      const b = { allow: true, direction: 'to', ipRange: '', protocol: 'TCP', port: 22 }
      assert(sameRule(a, b))
    })
  })

  describe('generateCookie', () => {
    it('skips DEFAULT_COOKIE, XAPI_LOCKING_COOKIE, and used cookies', () => {
      let callCount = 0
      const random = () => {
        const values = [
          Buffer.from([0, 0, 0, 0, 0, 0, 0, 0]), // DEFAULT_COOKIE
          Buffer.from([0, 0, 0, 0, 0, 0, 0, 1]), // XAPI_LOCKING_COOKIE
          Buffer.from([0, 0, 0, 0, 0, 0, 0, 2]), // Used cookie
          Buffer.from([0, 0, 0, 0, 0, 0, 0, 3]), // Good cookie
        ]
        return values[callCount++]
      }
      const usedCookies = new Set(['0x0000000000000002'])
      const cookie = generateCookie(usedCookies, random)
      assert.strictEqual(cookie, '0x0000000000000003')
    })

    it('generates cookies matching the hex pattern', () => {
      const cookies = new Set()
      for (let i = 0; i < 1000; i++) {
        const cookie = generateCookie(cookies)
        assert.match(cookie, /^0x[0-9a-f]{16}$/)
        cookies.add(cookie)
      }
      // All generated cookies should be unique
      assert.strictEqual(cookies.size, 1000)
    })
  })

  describe('bandOf', () => {
    it('returns 0 for band 0 priorities', () => {
      assert.strictEqual(bandOf(65000), 0)
      assert.strictEqual(bandOf(50001), 0)
    })

    it('returns 1 for band 1 priorities', () => {
      assert.strictEqual(bandOf(50000), 1)
      assert.strictEqual(bandOf(35001), 1)
    })

    it('returns -1 for legacy priorities', () => {
      assert.strictEqual(bandOf(35000), -1)
      assert.strictEqual(bandOf(32768), -1)
    })
  })

  describe('appendPriority', () => {
    it('returns top of band 0 for empty list', () => {
      assert.strictEqual(appendPriority([]), 65000)
    })

    it('returns priority - 1 for list in band 0', () => {
      const entries = [{ priority: 64990 }]
      assert.strictEqual(appendPriority(entries), 64989)
    })

    it('returns priority - 1 for list in band 1', () => {
      const entries = [{ priority: 40000 }]
      assert.strictEqual(appendPriority(entries), 39999)
    })

    it('returns undefined when band is full', () => {
      const entries = [{ priority: 50001 }]
      assert.strictEqual(appendPriority(entries), undefined)

      const entries2 = [{ priority: 35001 }]
      assert.strictEqual(appendPriority(entries2), undefined)
    })
  })

  describe('planRewrite', () => {
    it('moves list from band 0 to band 1', () => {
      const entries = [
        { allow: true, protocol: 'TCP', ipRange: '', direction: 'to', priority: 64990, cookie: '0xcookie1' },
        { allow: true, protocol: 'TCP', ipRange: '', direction: 'to', priority: 64989, cookie: '0xcookie2' },
      ]
      const result = planRewrite(entries)
      assert.strictEqual(result.entries[0].priority, 50000)
      assert.strictEqual(result.entries[1].priority, 49999)
    })

    it('moves list from band 1 to band 0', () => {
      const entries = [
        { allow: true, protocol: 'TCP', ipRange: '', direction: 'to', priority: 40000, cookie: '0xcookie1' },
        { allow: true, protocol: 'TCP', ipRange: '', direction: 'to', priority: 39999, cookie: '0xcookie2' },
      ]
      const result = planRewrite(entries)
      assert.strictEqual(result.entries[0].priority, 65000)
      assert.strictEqual(result.entries[1].priority, 64999)
    })

    it('moves legacy entries to band 0', () => {
      const entries = [{ allow: true, protocol: 'TCP', ipRange: '', direction: 'to', cookie: '0xcookie1' }]
      const result = planRewrite(entries)
      assert.strictEqual(result.entries[0].priority, 65000)
    })

    it('generates fresh cookies', () => {
      const entries = [
        { allow: true, protocol: 'TCP', ipRange: '', direction: 'to', cookie: '0xcookie1' },
        { allow: true, protocol: 'TCP', ipRange: '', direction: 'to', cookie: '0xcookie2' },
      ]
      const result = planRewrite(entries)
      assert.notStrictEqual(result.entries[0].cookie, '0xcookie1')
      assert.notStrictEqual(result.entries[1].cookie, '0xcookie2')
      assert.notStrictEqual(result.entries[0].cookie, result.entries[1].cookie)
    })

    it('sets previousCookies with old cookie first', () => {
      const entries = [
        { allow: true, protocol: 'TCP', ipRange: '', direction: 'to', priority: 64990, cookie: '0xcookie1' },
      ]
      const result = planRewrite(entries)
      assert(result.entries[0].previousCookies.includes('0xcookie1'))
    })

    it('omits previousCookies when entry has no cookie or previous cookies', () => {
      const entries = [{ allow: true, protocol: 'TCP', ipRange: '', direction: 'to' }]
      const result = planRewrite(entries)
      assert(!('previousCookies' in result.entries[0]))
    })

    it('sorts deleteOrder by old priority ascending', () => {
      const entries = [
        { allow: true, protocol: 'TCP', ipRange: '', direction: 'to', priority: 40000, cookie: '0xcookie1' },
        { allow: true, protocol: 'TCP', ipRange: '', direction: 'to', priority: 39999, cookie: '0xcookie2' },
      ]
      const result = planRewrite(entries)
      assert.strictEqual(result.deleteOrder.length, 2)
      // Verify deleteOrder is sorted by old priority (ascending)
      // Entry with old priority 39999 comes first, gets new priority 64999
      // Entry with old priority 40000 comes second, gets new priority 65000
      assert.strictEqual(result.deleteOrder[0].priority, 64999)
      assert.strictEqual(result.deleteOrder[1].priority, 65000)
    })

    it('throws when list exceeds band size', () => {
      const entries = []
      for (let i = 0; i < 15001; i++) {
        entries.push({
          allow: true,
          protocol: 'TCP',
          ipRange: '',
          direction: 'to',
          priority: 65000 - i,
          cookie: `0xcookie${i}`,
        })
      }
      assert.throws(() => planRewrite(entries), /cannot hold more than/)
    })
  })

  describe('serializeCopy', () => {
    it("keeps only the given MAC's entries in list order", () => {
      const entries = [
        { mac: 'aa:bb:cc:dd:ee:ff', allow: true, protocol: 'TCP', port: 22, ipRange: '10.0.0.0/24', direction: 'to' },
        { mac: 'aa:bb:cc:dd:ee:fe', allow: true, protocol: 'TCP', port: 80, ipRange: '10.0.0.0/24', direction: 'to' },
        { mac: 'aa:bb:cc:dd:ee:ff', allow: false, protocol: 'TCP', port: 443, ipRange: '0.0.0.0/0', direction: 'from' },
      ]
      const result = serializeCopy(entries, 'aa:bb:cc:dd:ee:ff')
      const parsed = JSON.parse(result)
      assert.strictEqual(parsed.length, 2)
      assert.deepStrictEqual(JSON.parse(parsed[0]), {
        allow: true,
        protocol: 'TCP',
        port: 22,
        ipRange: '10.0.0.0/24',
        direction: 'to',
      })
      assert.deepStrictEqual(JSON.parse(parsed[1]), {
        allow: false,
        protocol: 'TCP',
        port: 443,
        ipRange: '0.0.0.0/0',
        direction: 'from',
      })
    })

    it('omits port when undefined', () => {
      const entries = [
        { mac: 'aa:bb:cc:dd:ee:ff', allow: true, protocol: 'TCP', ipRange: '10.0.0.0/24', direction: 'to' },
      ]
      const result = serializeCopy(entries, 'aa:bb:cc:dd:ee:ff')
      const parsed = JSON.parse(result)
      const rule = JSON.parse(parsed[0])
      assert(!('port' in rule))
    })

    it('returns null when no entries match', () => {
      const entries = [
        { mac: 'aa:bb:cc:dd:ee:fe', allow: true, protocol: 'TCP', port: 22, ipRange: '10.0.0.0/24', direction: 'to' },
      ]
      const result = serializeCopy(entries, 'aa:bb:cc:dd:ee:ff')
      assert.strictEqual(result, null)
    })
  })

  describe('parseList', () => {
    it('returns undefined for undefined input', () => {
      assert.strictEqual(parseList(undefined), undefined)
    })

    it('parses JSON string to array', () => {
      const result = parseList('[]')
      assert.deepStrictEqual(result, [])
    })
  })

  describe('constants', () => {
    it('has correct LEGACY_PRIORITY', () => {
      assert.strictEqual(LEGACY_PRIORITY, 32768)
    })

    it('has correct BANDS', () => {
      assert.strictEqual(BANDS.length, 2)
      assert.deepStrictEqual(BANDS[0], { top: 65000, bottom: 50001 })
      assert.deepStrictEqual(BANDS[1], { top: 50000, bottom: 35001 })
    })

    it('has correct LEGACY_COOKIE', () => {
      assert.strictEqual(LEGACY_COOKIE, '0x0')
    })
  })
})
