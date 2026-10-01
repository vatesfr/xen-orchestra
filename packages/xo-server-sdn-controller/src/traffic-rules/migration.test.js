import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import {
  parseLegacy,
  hasLegacyRules,
  legacyEntries,
  migrate,
  neutralizeLegacy,
  neutralizeVifCopy,
} from './migration.js'
import { LEGACY_COOKIE } from './rules.js'

describe('migration', () => {
  describe('parseLegacy', () => {
    it('returns an empty array when raw is undefined', () => {
      const result = parseLegacy(undefined)
      assert.deepStrictEqual(result, [])
    })

    it('parses and double-parses the raw value', () => {
      const raw = '["{\\"allow\\":true,\\"protocol\\":\\"TCP\\"}"]'
      const result = parseLegacy(raw)
      assert.deepStrictEqual(result, [{ allow: true, protocol: 'TCP' }])
    })
  })

  describe('hasLegacyRules', () => {
    it('returns true when network key is present', () => {
      const network = {
        other_config: { 'xo:sdn-controller:of-rules': '[]' },
        $VIFs: [],
      }
      assert.strictEqual(hasLegacyRules(network), true)
    })

    it('returns true when a live VIF has the key', () => {
      const vif = {
        other_config: { 'xo:sdn-controller:of-rules': '[]' },
        $VM: { is_a_snapshot: false, is_a_template: false, is_control_domain: false },
      }
      const network = {
        other_config: {},
        $VIFs: [vif],
      }
      assert.strictEqual(hasLegacyRules(network), true)
    })

    it('returns false when only a snapshot VIF has the key', () => {
      const vif = {
        other_config: { 'xo:sdn-controller:of-rules': '[]' },
        $VM: { is_a_snapshot: true, is_a_template: false, is_control_domain: false },
      }
      const network = {
        other_config: {},
        $VIFs: [vif],
      }
      assert.strictEqual(hasLegacyRules(network), false)
    })

    it('returns false when there is nothing', () => {
      const network = {
        other_config: {},
        $VIFs: [],
      }
      assert.strictEqual(hasLegacyRules(network), false)
    })
  })

  describe('legacyEntries', () => {
    it('returns network rules first, then VIF rules', () => {
      const networkRaw =
        '["{\\"allow\\":true,\\"protocol\\":\\"TCP\\",\\"ipRange\\":\\"10.0.0.0/24\\",\\"direction\\":\\"to\\"}"]'
      const vifRaw =
        '["{\\"allow\\":false,\\"protocol\\":\\"UDP\\",\\"ipRange\\":\\"0.0.0.0/0\\",\\"direction\\":\\"from\\"}"]'
      const vif = {
        uuid: 'vif-uuid',
        device: '0',
        MAC: 'AA:BB:CC:DD:EE:FF',
        other_config: { 'xo:sdn-controller:of-rules': vifRaw },
        $VM: { name_label: 'vm', is_a_snapshot: false, is_a_template: false, is_control_domain: false },
      }
      const network = {
        other_config: { 'xo:sdn-controller:of-rules': networkRaw },
        $VIFs: [vif],
      }

      const result = legacyEntries(network)

      assert.strictEqual(result.length, 2)
      assert.strictEqual(result[0].ipRange, '10.0.0.0/24')
      assert.strictEqual(result[1].ipRange, '0.0.0.0/0')
      assert.strictEqual(result[1].mac, 'aa:bb:cc:dd:ee:ff')
    })

    it('sorts VIFs by VM name, then by device number', () => {
      const vifB2Raw =
        '["{\\"allow\\":true,\\"protocol\\":\\"TCP\\",\\"ipRange\\":\\"192.168.0.0/16\\",\\"direction\\":\\"to\\"}"]'
      const vifB10Raw =
        '["{\\"allow\\":true,\\"protocol\\":\\"TCP\\",\\"ipRange\\":\\"172.16.0.0/12\\",\\"direction\\":\\"to\\"}"]'
      const vifABridge =
        '["{\\"allow\\":true,\\"protocol\\":\\"TCP\\",\\"ipRange\\":\\"10.0.0.0/8\\",\\"direction\\":\\"to\\"}"]'

      const vifB2 = {
        uuid: 'vif-b2',
        device: '2',
        MAC: 'AA:AA:AA:AA:AA:02',
        other_config: { 'xo:sdn-controller:of-rules': vifB2Raw },
        $VM: { name_label: 'b', is_a_snapshot: false, is_a_template: false, is_control_domain: false },
      }
      const vifB10 = {
        uuid: 'vif-b10',
        device: '10',
        MAC: 'AA:AA:AA:AA:AA:10',
        other_config: { 'xo:sdn-controller:of-rules': vifB10Raw },
        $VM: { name_label: 'b', is_a_snapshot: false, is_a_template: false, is_control_domain: false },
      }
      const vifA = {
        uuid: 'vif-a',
        device: '0',
        MAC: 'AA:AA:AA:AA:AA:00',
        other_config: { 'xo:sdn-controller:of-rules': vifABridge },
        $VM: { name_label: 'a', is_a_snapshot: false, is_a_template: false, is_control_domain: false },
      }

      const network = {
        other_config: {},
        $VIFs: [vifB2, vifB10, vifA],
      }

      const result = legacyEntries(network)

      assert.strictEqual(result.length, 3)
      assert.strictEqual(result[0].ipRange, '10.0.0.0/8') // VM 'a'
      assert.strictEqual(result[1].ipRange, '192.168.0.0/16') // VM 'b', device 2
      assert.strictEqual(result[2].ipRange, '172.16.0.0/12') // VM 'b', device 10
    })

    it('ignores snapshot and template VIFs', () => {
      const snapshotRaw =
        '["{\\"allow\\":true,\\"protocol\\":\\"TCP\\",\\"ipRange\\":\\"10.0.0.0/24\\",\\"direction\\":\\"to\\"}"]'
      const snapshotVif = {
        uuid: 'snap-vif',
        device: '0',
        MAC: 'BB:BB:BB:BB:BB:BB',
        other_config: { 'xo:sdn-controller:of-rules': snapshotRaw },
        $VM: { name_label: 'snapshot', is_a_snapshot: true, is_a_template: false, is_control_domain: false },
      }
      const network = {
        other_config: {},
        $VIFs: [snapshotVif],
      }

      const result = legacyEntries(network)

      assert.strictEqual(result.length, 0)
    })

    it('lowercases MAC in VIF entries', () => {
      const vifRaw =
        '["{\\"allow\\":true,\\"protocol\\":\\"TCP\\",\\"ipRange\\":\\"10.0.0.0/24\\",\\"direction\\":\\"to\\"}"]'
      const vif = {
        uuid: 'vif-uuid',
        device: '0',
        MAC: 'AA:BB:CC:DD:EE:FF',
        other_config: { 'xo:sdn-controller:of-rules': vifRaw },
        $VM: { name_label: 'vm', is_a_snapshot: false, is_a_template: false, is_control_domain: false },
      }
      const network = {
        other_config: {},
        $VIFs: [vif],
      }

      const result = legacyEntries(network)

      assert.strictEqual(result[0].mac, 'aa:bb:cc:dd:ee:ff')
    })

    it('sets previousCookies to ["0x0"] for rules without a cookie', () => {
      const raw =
        '["{\\"allow\\":true,\\"protocol\\":\\"TCP\\",\\"ipRange\\":\\"10.0.0.0/24\\",\\"direction\\":\\"to\\"}"]'
      const network = {
        other_config: { 'xo:sdn-controller:of-rules': raw },
        $VIFs: [],
      }

      const result = legacyEntries(network)

      assert.deepStrictEqual(result[0].previousCookies, [LEGACY_COOKIE])
    })

    it('sets previousCookies to [cookie, "0x0"] for rules with a cookie', () => {
      const raw =
        '["{\\"allow\\":true,\\"protocol\\":\\"TCP\\",\\"ipRange\\":\\"10.0.0.0/24\\",\\"direction\\":\\"to\\",\\"cookie\\":\\"0x1234567890abcdef\\"}"]'
      const network = {
        other_config: { 'xo:sdn-controller:of-rules': raw },
        $VIFs: [],
      }

      const result = legacyEntries(network)

      assert.deepStrictEqual(result[0].previousCookies, ['0x1234567890abcdef', LEGACY_COOKIE])
    })

    it('keeps the last duplicate match on the same VIF', () => {
      const vifRaw =
        '["{\\"allow\\":true,\\"protocol\\":\\"TCP\\",\\"port\\":22,\\"ipRange\\":\\"10.0.0.0/24\\",\\"direction\\":\\"to\\"}","{\\"allow\\":true,\\"protocol\\":\\"tcp\\",\\"port\\":22,\\"ipRange\\":\\"10.0.0.0/24\\",\\"direction\\":\\"to\\"}"]'
      const vif = {
        uuid: 'vif-uuid',
        device: '0',
        MAC: 'AA:BB:CC:DD:EE:FF',
        other_config: { 'xo:sdn-controller:of-rules': vifRaw },
        $VM: { name_label: 'vm', is_a_snapshot: false, is_a_template: false, is_control_domain: false },
      }
      const network = {
        other_config: {},
        $VIFs: [vif],
      }

      const result = legacyEntries(network)

      assert.strictEqual(result.length, 1)
      assert.strictEqual(result[0].protocol, 'tcp')
    })
  })

  describe('migrate', () => {
    it('calls rewrite with legacyEntries and removes the network key', async () => {
      const calls = []
      const raw =
        '["{\\"allow\\":true,\\"protocol\\":\\"TCP\\",\\"ipRange\\":\\"10.0.0.0/24\\",\\"direction\\":\\"to\\"}"]'
      const network = {
        uuid: 'net-uuid',
        other_config: { 'xo:sdn-controller:of-rules': raw },
        $VIFs: [],
        $xapi: {
          barrier: async ref => network,
        },
        update_other_config: async (key, value) => {
          calls.push([key, value])
        },
      }

      const plugin = {
        async install(net, entry) {
          return new Map([['host-a', undefined]])
        },
        async deleteCookie(net, entry, cookie, hosts) {
          return new Map(hosts.map(h => [h.$ref, undefined]))
        },
        async deleteLegacy(net, entry, hosts) {
          return new Map(hosts.map(h => [h.$ref, undefined]))
        },
      }

      const store = {
        async save(net, entries) {
          return net
        },
      }

      network.$PIFs = [{ $host: { $ref: 'host-a' } }]

      const result = await migrate({ network, plugin, store })

      assert.strictEqual(result.uuid, 'net-uuid')
      assert(calls.some(([key]) => key === 'xo:sdn-controller:of-rules'))
    })

    it('installs all entries before deleting', async () => {
      const events = []
      const raw =
        '["{\\"allow\\":true,\\"protocol\\":\\"TCP\\",\\"ipRange\\":\\"10.0.0.0/24\\",\\"direction\\":\\"to\\",\\"cookie\\":\\"0x1111111111111111\\"}"]'
      const network = {
        uuid: 'net-uuid',
        other_config: { 'xo:sdn-controller:of-rules': raw },
        $VIFs: [],
        $xapi: {
          barrier: async ref => network,
        },
        update_other_config: async () => {},
      }

      const plugin = {
        async install(net, entry) {
          events.push({ op: 'install' })
          return new Map([['host-a', undefined]])
        },
        async deleteCookie(net, entry, cookie, hosts) {
          events.push({ op: 'deleteCookie' })
          return new Map(hosts.map(h => [h.$ref, undefined]))
        },
        async deleteLegacy(net, entry, hosts) {
          events.push({ op: 'deleteLegacy' })
          return new Map(hosts.map(h => [h.$ref, undefined]))
        },
      }

      const store = {
        async save(net, entries) {
          return net
        },
      }

      network.$PIFs = [{ $host: { $ref: 'host-a' } }]

      await migrate({ network, plugin, store })

      const installIndex = events.findIndex(e => e.op === 'install')
      const deleteIndex = events.findIndex(e => e.op !== 'install')
      assert(installIndex < deleteIndex || deleteIndex === -1)
    })
  })

  describe('neutralizeLegacy', () => {
    it('deletes network key rules and removes the key', async () => {
      const calls = []
      const raw =
        '["{\\"allow\\":true,\\"protocol\\":\\"TCP\\",\\"ipRange\\":\\"10.0.0.0/24\\",\\"direction\\":\\"to\\",\\"cookie\\":\\"0x1234567890abcdef\\"}"]'
      const network = {
        uuid: 'net-uuid',
        other_config: { 'xo:sdn-controller:of-rules': raw },
        $VIFs: [],
        $xapi: {
          barrier: async ref => network,
        },
        update_other_config: async (key, value) => {
          calls.push([key, value])
        },
      }

      const plugin = {
        async deleteCookie(net, fields, cookie) {
          calls.push({ op: 'deleteCookie', cookie })
          return new Map()
        },
        async deleteLegacy(net, fields) {
          calls.push({ op: 'deleteLegacy' })
          return new Map()
        },
      }

      await neutralizeLegacy({ network, entries: [], plugin })

      assert(calls.some(c => c[0] === 'xo:sdn-controller:of-rules' && c[1] === null))
      assert(calls.some(c => c.op === 'deleteCookie' && c.cookie === '0x1234567890abcdef'))
      assert(calls.some(c => c.op === 'deleteLegacy'))
    })

    it('skips network delete when there is no key', async () => {
      const network = {
        uuid: 'net-uuid',
        other_config: {},
        $VIFs: [],
        $xapi: {
          barrier: async ref => network,
        },
        update_other_config: async () => {
          throw new Error('should not be called')
        },
      }

      const plugin = {
        async deleteCookie() {
          return new Map()
        },
        async deleteLegacy() {
          return new Map()
        },
      }

      const result = await neutralizeLegacy({ network, entries: [], plugin })

      assert.strictEqual(result.uuid, 'net-uuid')
    })

    it('skips VIF delete when the copy matches the list', async () => {
      const calls = []
      const legacyRaw =
        '["{\\"allow\\":true,\\"protocol\\":\\"TCP\\",\\"port\\":22,\\"ipRange\\":\\"10.0.0.0/24\\",\\"direction\\":\\"to\\"}"]'
      const vif = {
        uuid: 'vif-uuid',
        MAC: 'AA:BB:CC:DD:EE:FF',
        other_config: { 'xo:sdn-controller:of-rules': legacyRaw },
        $VM: { is_a_snapshot: false, is_a_template: false, is_control_domain: false },
      }
      const network = {
        uuid: 'net-uuid',
        other_config: {},
        $VIFs: [vif],
        $xapi: {
          barrier: async ref => network,
        },
        update_other_config: async () => {},
      }

      const plugin = {
        async deleteLegacy(net, fields) {
          calls.push({ op: 'deleteLegacy' })
          return new Map()
        },
      }

      const entries = [
        {
          mac: 'aa:bb:cc:dd:ee:ff',
          allow: true,
          protocol: 'TCP',
          port: 22,
          ipRange: '10.0.0.0/24',
          direction: 'to',
        },
      ]

      await neutralizeLegacy({ network, entries, plugin })

      assert.strictEqual(calls.filter(c => c.op === 'deleteLegacy').length, 0)
    })

    it('deletes VIF copy rules that differ from the list', async () => {
      const calls = []
      const legacyRaw =
        '["{\\"allow\\":true,\\"protocol\\":\\"TCP\\",\\"port\\":22,\\"ipRange\\":\\"10.0.0.0/24\\",\\"direction\\":\\"to\\"}","{\\"allow\\":false,\\"protocol\\":\\"UDP\\",\\"ipRange\\":\\"0.0.0.0/0\\",\\"direction\\":\\"from\\"}"]'
      const vif = {
        uuid: 'vif-uuid',
        MAC: 'AA:BB:CC:DD:EE:FF',
        other_config: { 'xo:sdn-controller:of-rules': legacyRaw },
        $VM: { is_a_snapshot: false, is_a_template: false, is_control_domain: false },
      }
      const network = {
        uuid: 'net-uuid',
        other_config: {},
        $VIFs: [vif],
        $xapi: {
          barrier: async ref => network,
        },
        update_other_config: async () => {},
      }

      const plugin = {
        async deleteLegacy(net, fields) {
          calls.push({ op: 'deleteLegacy', ipRange: fields.ipRange })
          return new Map()
        },
      }

      const entries = [
        {
          mac: 'aa:bb:cc:dd:ee:ff',
          allow: true,
          protocol: 'TCP',
          port: 22,
          ipRange: '10.0.0.0/24',
          direction: 'to',
        },
      ]

      await neutralizeLegacy({ network, entries, plugin })

      const deleteCalls = calls.filter(c => c.op === 'deleteLegacy')
      assert.strictEqual(deleteCalls.length, 1)
      assert.strictEqual(deleteCalls[0].ipRange, '0.0.0.0/0')
    })
  })

  describe('neutralizeVifCopy', () => {
    it('does nothing when the VIF has no legacy key', async () => {
      const vif = {
        uuid: 'vif-uuid',
        MAC: 'AA:BB:CC:DD:EE:FF',
        other_config: {},
      }
      const network = {
        uuid: 'net-uuid',
      }
      const plugin = {
        async deleteLegacy() {
          throw new Error('should not be called')
        },
      }

      await neutralizeVifCopy({ network, vif, entries: [], plugin })
    })

    it('skips deletes for rules in the list', async () => {
      const calls = []
      const legacyRaw =
        '["{\\"allow\\":true,\\"protocol\\":\\"TCP\\",\\"port\\":22,\\"ipRange\\":\\"10.0.0.0/24\\",\\"direction\\":\\"to\\"}"]'
      const vif = {
        uuid: 'vif-uuid',
        MAC: 'AA:BB:CC:DD:EE:FF',
        other_config: { 'xo:sdn-controller:of-rules': legacyRaw },
      }
      const network = {
        uuid: 'net-uuid',
      }
      const plugin = {
        async deleteLegacy() {
          calls.push('deleteLegacy')
          return new Map()
        },
      }
      const entries = [
        {
          mac: 'aa:bb:cc:dd:ee:ff',
          allow: true,
          protocol: 'TCP',
          port: 22,
          ipRange: '10.0.0.0/24',
          direction: 'to',
        },
      ]

      await neutralizeVifCopy({ network, vif, entries, plugin })

      assert.strictEqual(calls.length, 0)
    })

    it('deletes rules not in the list', async () => {
      const calls = []
      const legacyRaw =
        '["{\\"allow\\":false,\\"protocol\\":\\"UDP\\",\\"ipRange\\":\\"0.0.0.0/0\\",\\"direction\\":\\"from\\"}"]'
      const vif = {
        uuid: 'vif-uuid',
        MAC: 'AA:BB:CC:DD:EE:FF',
        other_config: { 'xo:sdn-controller:of-rules': legacyRaw },
      }
      const network = {
        uuid: 'net-uuid',
      }
      const plugin = {
        async deleteLegacy(net, fields) {
          calls.push({ mac: fields.mac, ipRange: fields.ipRange })
          return new Map()
        },
      }
      const entries = []

      await neutralizeVifCopy({ network, vif, entries, plugin })

      assert.strictEqual(calls.length, 1)
      assert.strictEqual(calls[0].mac, 'aa:bb:cc:dd:ee:ff')
      assert.strictEqual(calls[0].ipRange, '0.0.0.0/0')
    })
  })
})
