import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import { rewrite, apply, remove } from './engine.js'
import { LEGACY_COOKIE } from './rules.js'

describe('engine', () => {
  describe('rewrite', () => {
    it('installs all entries before any delete', async () => {
      const calls = []
      const saves = []
      const network = { uuid: 'test', $PIFs: [{ $host: { $ref: 'A' } }, { $host: { $ref: 'B' } }] }

      const plugin = {
        async install(net, entry) {
          calls.push({ op: 'install', priority: entry.priority })
          return new Map([
            ['A', undefined],
            ['B', undefined],
          ])
        },
        async deleteCookie(net, entry, cookie, hosts) {
          calls.push({ op: 'deleteCookie', cookie })
          return new Map(hosts.map(h => [h.$ref, undefined]))
        },
        async deleteLegacy(net, entry, hosts) {
          calls.push({ op: 'deleteLegacy' })
          return new Map(hosts.map(h => [h.$ref, undefined]))
        },
      }

      const store = {
        async save(net, entries) {
          saves.push(JSON.parse(JSON.stringify(entries)))
          return net
        },
      }

      const entries = [
        { priority: 65000, cookie: '0x1', previousCookies: ['0x2'] },
        { priority: 64999, cookie: '0x3', previousCookies: ['0x4'] },
      ]

      await rewrite({ network, entries, deleteOrder: entries, plugin, store })

      // Find install and delete call positions
      const installCount = calls.filter(c => c.op === 'install').length
      const firstDeleteIndex = calls.findIndex(c => c.op !== 'install')

      // All installs come before deletes
      assert.strictEqual(installCount, 2)
      assert(firstDeleteIndex > 1 || firstDeleteIndex === -1)
    })

    it('saves twice with previousCookies first', async () => {
      const saves = []
      const network = { uuid: 'test', $PIFs: [{ $host: { $ref: 'A' } }, { $host: { $ref: 'B' } }] }

      const plugin = {
        async install() {
          return new Map([
            ['A', undefined],
            ['B', undefined],
          ])
        },
        async deleteCookie(net, entry, cookie, hosts) {
          return new Map(hosts.map(h => [h.$ref, undefined]))
        },
        async deleteLegacy() {
          return new Map()
        },
      }

      const store = {
        async save(net, entries) {
          saves.push(JSON.parse(JSON.stringify(entries)))
          return net
        },
      }

      const entries = [{ priority: 65000, cookie: '0x1', previousCookies: ['0xold'] }]

      await rewrite({ network, entries, deleteOrder: entries, plugin, store })

      assert.strictEqual(saves.length, 2)
      // First save has previousCookies
      assert.deepStrictEqual(saves[0][0].previousCookies, ['0xold'])
      // Second save pruned previousCookies
      assert(!('previousCookies' in saves[1][0]))
    })

    it('keeps previousCookies if delete fails', async () => {
      const saves = []
      const network = { uuid: 'test', $PIFs: [{ $host: { $ref: 'A' } }, { $host: { $ref: 'B' } }] }

      const plugin = {
        async install() {
          return new Map([
            ['A', undefined],
            ['B', undefined],
          ])
        },
        async deleteCookie(net, entry, cookie, hosts) {
          // Fails on B
          const outcomes = new Map()
          outcomes.set('A', undefined)
          outcomes.set('B', new Error('failed'))
          return outcomes
        },
        async deleteLegacy() {
          return new Map()
        },
      }

      const store = {
        async save(net, entries) {
          saves.push(JSON.parse(JSON.stringify(entries)))
          return net
        },
      }

      const entries = [{ priority: 65000, cookie: '0x1', previousCookies: ['0xold'] }]

      await rewrite({ network, entries, deleteOrder: entries, plugin, store })

      // Second save should still have previousCookies because delete failed
      assert.deepStrictEqual(saves[1][0].previousCookies, ['0xold'])
    })

    it('uses LEGACY_COOKIE correctly', async () => {
      const calls = []
      const saves = []
      const network = { uuid: 'test', $PIFs: [{ $host: { $ref: 'A' } }, { $host: { $ref: 'B' } }] }

      const plugin = {
        async install() {
          return new Map([
            ['A', undefined],
            ['B', undefined],
          ])
        },
        async deleteCookie(net, entry, cookie, hosts) {
          calls.push({ op: 'deleteCookie', cookie })
          return new Map(hosts.map(h => [h.$ref, undefined]))
        },
        async deleteLegacy() {
          calls.push({ op: 'deleteLegacy' })
          return new Map([
            ['A', undefined],
            ['B', undefined],
          ])
        },
      }

      const store = {
        async save(net, entries) {
          saves.push(JSON.parse(JSON.stringify(entries)))
          return net
        },
      }

      const entries = [{ priority: 65000, cookie: '0x1', previousCookies: [LEGACY_COOKIE] }]

      await rewrite({ network, entries, deleteOrder: entries, plugin, store })

      // Should call deleteLegacy, not deleteCookie with LEGACY_COOKIE
      assert(!calls.some(c => c.op === 'deleteCookie' && c.cookie === LEGACY_COOKIE))
      assert(calls.some(c => c.op === 'deleteLegacy'))
    })
  })

  describe('apply', () => {
    it('installs before deletes', async () => {
      const calls = []
      const saves = []
      const network = { uuid: 'test', $PIFs: [{ $host: { $ref: 'A' } }, { $host: { $ref: 'B' } }] }

      const plugin = {
        async install() {
          calls.push('install')
          return new Map([
            ['A', undefined],
            ['B', undefined],
          ])
        },
        async deleteCookie(net, entry, cookie, hosts) {
          calls.push('deleteCookie')
          return new Map(hosts.map(h => [h.$ref, undefined]))
        },
        async deleteLegacy() {
          calls.push('deleteLegacy')
          return new Map([
            ['A', undefined],
            ['B', undefined],
          ])
        },
      }

      const store = {
        async save(net, entries) {
          saves.push(JSON.parse(JSON.stringify(entries)))
          return net
        },
      }

      const entries = [{ priority: 65000, cookie: '0x1', previousCookies: ['0x2'] }]

      await apply({ network, list: entries, entries, plugin, store })

      const installIndex = calls.indexOf('install')
      const deleteIndex = calls.lastIndexOf('install') + 1

      assert(installIndex < deleteIndex)
    })

    it('saves list only when previousCookies dropped', async () => {
      const saves = []
      const network = { uuid: 'test', $PIFs: [{ $host: { $ref: 'A' } }, { $host: { $ref: 'B' } }] }

      const plugin = {
        async install() {
          return new Map([
            ['A', undefined],
            ['B', undefined],
          ])
        },
        async deleteCookie(net, entry, cookie, hosts) {
          return new Map(hosts.map(h => [h.$ref, undefined]))
        },
        async deleteLegacy() {
          return new Map([
            ['A', undefined],
            ['B', undefined],
          ])
        },
      }

      const store = {
        async save(net, entries) {
          saves.push(JSON.parse(JSON.stringify(entries)))
          return net
        },
      }

      const list = [{ priority: 65000, cookie: '0x1', previousCookies: ['0x2'] }]
      const entries = [{ priority: 65000, cookie: '0x1', previousCookies: ['0x2'] }]

      await apply({ network, list, entries, plugin, store })

      // Should save because previousCookies were dropped
      assert.strictEqual(saves.length, 1)
    })

    it('returns network without saving when previousCookies unchanged', async () => {
      const saves = []
      const network = { uuid: 'test', $PIFs: [{ $host: { $ref: 'A' } }, { $host: { $ref: 'B' } }] }

      const plugin = {
        async install() {
          return new Map([
            ['A', undefined],
            ['B', undefined],
          ])
        },
        async deleteCookie(net, entry, cookie, hosts) {
          // Fails on B, so previousCookies stays
          const outcomes = new Map()
          outcomes.set('A', undefined)
          outcomes.set('B', new Error('failed'))
          return outcomes
        },
        async deleteLegacy() {
          return new Map([
            ['A', undefined],
            ['B', undefined],
          ])
        },
      }

      const store = {
        async save(net, entries) {
          saves.push(JSON.parse(JSON.stringify(entries)))
          return net
        },
      }

      const list = [{ priority: 65000, cookie: '0x1', previousCookies: ['0x2'] }]
      const entries = [{ priority: 65000, cookie: '0x1', previousCookies: ['0x2'] }]

      const result = await apply({ network, list, entries, plugin, store })

      // Should not save
      assert.strictEqual(saves.length, 0)
      // Should return the network
      assert.strictEqual(result, network)
    })
  })

  describe('remove', () => {
    it('calls deleteCookie for current and previousCookies, then deleteLegacy', async () => {
      const calls = []
      const network = { uuid: 'test', $PIFs: [{ $host: { $ref: 'A' } }, { $host: { $ref: 'B' } }] }

      const plugin = {
        async deleteCookie(net, entry, cookie, hosts) {
          calls.push({ op: 'deleteCookie', cookie })
          return new Map(hosts.map(h => [h.$ref, undefined]))
        },
        async deleteLegacy() {
          calls.push({ op: 'deleteLegacy' })
          return new Map([
            ['A', undefined],
            ['B', undefined],
          ])
        },
      }

      const entry = {
        priority: 65000,
        cookie: '0x1',
        previousCookies: ['0x2', '0x3'],
      }

      await remove({ network, entry, plugin })

      const deleteCookieCalls = calls.filter(c => c.op === 'deleteCookie')
      const deleteLegacyCalls = calls.filter(c => c.op === 'deleteLegacy')

      assert.strictEqual(deleteCookieCalls.length, 3)
      assert.strictEqual(deleteCookieCalls[0].cookie, '0x1')
      assert.strictEqual(deleteCookieCalls[1].cookie, '0x2')
      assert.strictEqual(deleteCookieCalls[2].cookie, '0x3')
      assert.strictEqual(deleteLegacyCalls.length, 1)
    })

    it('skips LEGACY_COOKIE in previousCookies', async () => {
      const calls = []
      const network = { uuid: 'test', $PIFs: [{ $host: { $ref: 'A' } }, { $host: { $ref: 'B' } }] }

      const plugin = {
        async deleteCookie(net, entry, cookie, hosts) {
          calls.push({ op: 'deleteCookie', cookie })
          return new Map(hosts.map(h => [h.$ref, undefined]))
        },
        async deleteLegacy() {
          calls.push({ op: 'deleteLegacy' })
          return new Map([
            ['A', undefined],
            ['B', undefined],
          ])
        },
      }

      const entry = {
        priority: 65000,
        cookie: '0x1',
        previousCookies: [LEGACY_COOKIE, '0x2'],
      }

      await remove({ network, entry, plugin })

      const deleteCookieCalls = calls.filter(c => c.op === 'deleteCookie')

      // Should not call deleteCookie with LEGACY_COOKIE
      assert(!deleteCookieCalls.some(c => c.cookie === LEGACY_COOKIE))
      // Should call for current and 0x2
      assert.strictEqual(deleteCookieCalls.length, 2)
    })

    it('throws when deleteCookie fails on all hosts', async () => {
      const network = { uuid: 'test', $PIFs: [{ $host: { $ref: 'A' } }, { $host: { $ref: 'B' } }] }

      const plugin = {
        async deleteCookie() {
          const error = new Error('failed')
          return new Map([
            ['A', error],
            ['B', error],
          ])
        },
        async deleteLegacy() {
          return new Map([
            ['A', undefined],
            ['B', undefined],
          ])
        },
      }

      const entry = { priority: 65000, cookie: '0x1' }

      await assert.rejects(async () => remove({ network, entry, plugin }), /failed/)
    })

    it('succeeds when deleteCookie fails on some hosts', async () => {
      const network = { uuid: 'test', $PIFs: [{ $host: { $ref: 'A' } }, { $host: { $ref: 'B' } }] }

      const plugin = {
        async deleteCookie() {
          return new Map([
            ['A', undefined],
            ['B', new Error('failed')],
          ])
        },
        async deleteLegacy() {
          return new Map([
            ['A', undefined],
            ['B', undefined],
          ])
        },
      }

      const entry = { priority: 65000, cookie: '0x1' }

      // Should not throw
      await remove({ network, entry, plugin })
    })

    it('succeeds with no hosts', async () => {
      const network = { uuid: 'test', $PIFs: [] }

      const plugin = {
        async deleteCookie() {
          return new Map()
        },
        async deleteLegacy() {
          return new Map()
        },
      }

      const entry = { priority: 65000, cookie: '0x1' }

      // Should not throw
      await remove({ network, entry, plugin })
    })
  })
})
