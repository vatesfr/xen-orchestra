import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'
import { isManaged, readList, liveVifs, save } from './store.js'

describe('store', () => {
  describe('isManaged', () => {
    it('returns false without the key', () => {
      const network = { other_config: {} }
      assert.strictEqual(isManaged(network), false)
    })

    it('returns true for "[]"', () => {
      const network = { other_config: { 'xo:sdn-controller:traffic-rules': '[]' } }
      assert.strictEqual(isManaged(network), true)
    })
  })

  describe('readList', () => {
    it('returns undefined when the key is absent', () => {
      const network = { other_config: {} }
      assert.strictEqual(readList(network), undefined)
    })

    it('parses and returns the array when the key is present', () => {
      const network = { other_config: { 'xo:sdn-controller:traffic-rules': '[{"allow":true}]' } }
      const result = readList(network)
      assert.deepStrictEqual(result, [{ allow: true }])
    })
  })

  describe('liveVifs', () => {
    it('drops a snapshot VIF', () => {
      const vif = {
        $VM: { is_a_snapshot: true, is_a_template: false, is_control_domain: false },
      }
      const network = { $VIFs: [vif] }
      const result = liveVifs(network)
      assert.strictEqual(result.length, 0)
    })

    it('drops a template VIF', () => {
      const vif = {
        $VM: { is_a_snapshot: false, is_a_template: true, is_control_domain: false },
      }
      const network = { $VIFs: [vif] }
      const result = liveVifs(network)
      assert.strictEqual(result.length, 0)
    })

    it('drops a control domain VIF', () => {
      const vif = {
        $VM: { is_a_snapshot: false, is_a_template: false, is_control_domain: true },
      }
      const network = { $VIFs: [vif] }
      const result = liveVifs(network)
      assert.strictEqual(result.length, 0)
    })

    it('drops a VIF without a VM', () => {
      const vif = { $VM: undefined }
      const network = { $VIFs: [vif] }
      const result = liveVifs(network)
      assert.strictEqual(result.length, 0)
    })

    it('includes a normal VIF', () => {
      const vif = {
        $VM: { is_a_snapshot: false, is_a_template: false, is_control_domain: false },
      }
      const network = { $VIFs: [vif] }
      const result = liveVifs(network)
      assert.strictEqual(result.length, 1)
      assert.strictEqual(result[0], vif)
    })
  })

  describe('save', () => {
    it('writes the list sorted by priority, descending', async () => {
      const updateLog = []
      const network = {
        other_config: {},
        $ref: 'network-ref',
        $VIFs: [],
        $xapi: {
          barrier: async ref => network,
        },
        update_other_config: async (key, value) => {
          updateLog.push([key, value])
        },
      }

      const entries = [
        { priority: 1, cookie: 'c1' },
        { priority: 3, cookie: 'c3' },
        { priority: 2, cookie: 'c2' },
      ]
      await save(network, entries)

      assert.deepStrictEqual(entries, [
        { priority: 3, cookie: 'c3' },
        { priority: 2, cookie: 'c2' },
        { priority: 1, cookie: 'c1' },
      ])

      assert.strictEqual(updateLog[0][0], 'xo:sdn-controller:traffic-rules')
      const saved = JSON.parse(updateLog[0][1])
      assert.deepStrictEqual(saved, [
        { priority: 3, cookie: 'c3' },
        { priority: 2, cookie: 'c2' },
        { priority: 1, cookie: 'c1' },
      ])
    })

    it('writes each live VIF copy, with only its MAC entries', async () => {
      const vifUpdates = {}
      const vif = {
        MAC: 'AA:BB:CC:DD:EE:FF',
        other_config: {},
        $VM: { is_a_snapshot: false, is_a_template: false, is_control_domain: false },
        update_other_config: async (key, value) => {
          if (!vifUpdates[vif.MAC]) {
            vifUpdates[vif.MAC] = {}
          }
          vifUpdates[vif.MAC][key] = value
        },
      }

      const network = {
        other_config: {},
        $ref: 'network-ref',
        $VIFs: [vif],
        $xapi: {
          barrier: async ref => network,
        },
        update_other_config: async () => {},
      }

      const entries = [
        {
          mac: 'aa:bb:cc:dd:ee:ff',
          allow: true,
          protocol: 'TCP',
          ipRange: '10.0.0.0/24',
          direction: 'to',
          priority: 1,
          cookie: 'c1',
        },
      ]
      await save(network, entries)

      const copy = vifUpdates[vif.MAC]['xo:sdn-controller:of-rules']
      assert(copy !== null)
      const parsed = JSON.parse(copy)
      assert.strictEqual(parsed.length, 1)
      assert.deepStrictEqual(JSON.parse(parsed[0]), {
        allow: true,
        protocol: 'TCP',
        ipRange: '10.0.0.0/24',
        direction: 'to',
      })
    })

    it('handles uppercase MAC in vif.MAC and lowercase in entries', async () => {
      const vifUpdates = {}
      const vif = {
        MAC: 'AA:BB:CC:DD:EE:FF',
        other_config: {},
        $VM: { is_a_snapshot: false, is_a_template: false, is_control_domain: false },
        update_other_config: async (key, value) => {
          vifUpdates[key] = value
        },
      }

      const network = {
        other_config: {},
        $ref: 'network-ref',
        $VIFs: [vif],
        $xapi: {
          barrier: async ref => network,
        },
        update_other_config: async () => {},
      }

      const entries = [
        {
          mac: 'aa:bb:cc:dd:ee:ff',
          allow: true,
          protocol: 'TCP',
          ipRange: '10.0.0.0/24',
          direction: 'to',
          priority: 1,
          cookie: 'c1',
        },
      ]
      await save(network, entries)

      const copy = vifUpdates['xo:sdn-controller:of-rules']
      assert(copy !== null)
    })

    it('does not write a VIF whose copy is already identical', async () => {
      let updateCallCount = 0
      const vif = {
        MAC: 'aa:bb:cc:dd:ee:ff',
        other_config: {
          'xo:sdn-controller:of-rules':
            '["{\\"allow\\":true,\\"protocol\\":\\"TCP\\",\\"port\\":22,\\"ipRange\\":\\"10.0.0.0/24\\",\\"direction\\":\\"to\\"}"]',
        },
        $VM: { is_a_snapshot: false, is_a_template: false, is_control_domain: false },
        update_other_config: async () => {
          updateCallCount++
        },
      }

      const network = {
        other_config: {},
        $ref: 'network-ref',
        $VIFs: [vif],
        $xapi: {
          barrier: async ref => network,
        },
        update_other_config: async () => {},
      }

      const entries = [
        {
          mac: 'aa:bb:cc:dd:ee:ff',
          allow: true,
          protocol: 'TCP',
          port: 22,
          ipRange: '10.0.0.0/24',
          direction: 'to',
          priority: 1,
          cookie: 'c1',
        },
      ]
      await save(network, entries)

      assert.strictEqual(updateCallCount, 0)
    })

    it('writes null on a live VIF with no entry left but still a key', async () => {
      const vifUpdates = {}
      const vif = {
        MAC: 'aa:bb:cc:dd:ee:ff',
        other_config: { 'xo:sdn-controller:of-rules': '["{\\"allow\\":true}"]' },
        $VM: { is_a_snapshot: false, is_a_template: false, is_control_domain: false },
        update_other_config: async (key, value) => {
          vifUpdates[key] = value
        },
      }

      const network = {
        other_config: {},
        $ref: 'network-ref',
        $VIFs: [vif],
        $xapi: {
          barrier: async ref => network,
        },
        update_other_config: async () => {},
      }

      const entries = [
        {
          mac: 'bb:bb:bb:bb:bb:bb',
          allow: true,
          protocol: 'TCP',
          ipRange: '10.0.0.0/24',
          direction: 'to',
          priority: 1,
          cookie: 'c1',
        },
      ]
      await save(network, entries)

      assert.strictEqual(vifUpdates['xo:sdn-controller:of-rules'], null)
    })

    it('does not write a VIF that has no entry and no key', async () => {
      let updateCallCount = 0
      const vif = {
        MAC: 'aa:bb:cc:dd:ee:ff',
        other_config: {},
        $VM: { is_a_snapshot: false, is_a_template: false, is_control_domain: false },
        update_other_config: async () => {
          updateCallCount++
        },
      }

      const network = {
        other_config: {},
        $ref: 'network-ref',
        $VIFs: [vif],
        $xapi: {
          barrier: async ref => network,
        },
        update_other_config: async () => {},
      }

      const entries = [
        {
          mac: 'bb:bb:bb:bb:bb:bb',
          allow: true,
          protocol: 'TCP',
          ipRange: '10.0.0.0/24',
          direction: 'to',
          priority: 1,
          cookie: 'c1',
        },
      ]
      await save(network, entries)

      assert.strictEqual(updateCallCount, 0)
    })

    it('ignores snapshot VIFs', async () => {
      const vifUpdates = {}
      const snapshotVif = {
        MAC: 'aa:bb:cc:dd:ee:ff',
        other_config: {},
        $VM: { is_a_snapshot: true, is_a_template: false, is_control_domain: false },
        update_other_config: async (key, value) => {
          vifUpdates[key] = value
        },
      }

      const network = {
        other_config: {},
        $ref: 'network-ref',
        $VIFs: [snapshotVif],
        $xapi: {
          barrier: async ref => network,
        },
        update_other_config: async () => {},
      }

      const entries = [
        {
          mac: 'aa:bb:cc:dd:ee:ff',
          allow: true,
          protocol: 'TCP',
          ipRange: '10.0.0.0/24',
          direction: 'to',
          priority: 1,
          cookie: 'c1',
        },
      ]
      await save(network, entries)

      assert.strictEqual(Object.keys(vifUpdates).length, 0)
    })

    it('resolves to what barrier returns', async () => {
      const barrierResult = { other_config: {} }
      const network = {
        other_config: {},
        $ref: 'network-ref',
        $VIFs: [],
        $xapi: {
          barrier: async () => barrierResult,
        },
        update_other_config: async () => {},
      }

      const entries = []
      const result = await save(network, entries)

      assert.strictEqual(result, barrierResult)
    })
  })
})
