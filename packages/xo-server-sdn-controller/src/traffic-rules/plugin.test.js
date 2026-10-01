import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'
import { hostsOf, TrafficRulesPlugin } from './plugin.js'

describe('hostsOf', () => {
  it('returns the hosts from PIFs', () => {
    const hostA = { uuid: 'a', $ref: 'ref-a' }
    const hostB = { uuid: 'b', $ref: 'ref-b' }
    const network = {
      $PIFs: [{ $host: hostA }, { $host: hostB }],
    }

    const result = hostsOf(network)

    assert.deepEqual(result, [hostA, hostB])
  })
})

describe('TrafficRulesPlugin', () => {
  const hostA = {
    uuid: 'uuid-a',
    $ref: 'ref-a',
    $PIFs: [{ $network: { bridge: 'xapi1' } }],
    $xapi: { call: async () => {} },
  }
  const hostB = {
    uuid: 'uuid-b',
    $ref: 'ref-b',
    $PIFs: [{ $network: { bridge: 'xapi1' } }],
    $xapi: { call: async () => {} },
  }
  const network = {
    bridge: 'xapi1',
    $PIFs: [{ $host: hostA }, { $host: hostB }],
  }

  describe('install', () => {
    it('sends add-rule with correct arguments for a VIF entry', async () => {
      const plugin = new TrafficRulesPlugin()
      const calls = []
      hostA.$xapi.call = async (...args) => {
        calls.push(args)
      }
      hostB.$xapi.call = async (...args) => {
        calls.push(args)
      }

      const entry = {
        mac: 'aa:bb:cc:dd:ee:ff',
        protocol: 'TCP',
        port: 22,
        ipRange: '10.0.0.0/24',
        direction: 'to',
        allow: true,
        priority: 65000,
        cookie: '0x0123456789abcdef',
      }

      await plugin.install(network, entry, [hostA, hostB])

      assert.equal(calls.length, 2)
      calls.forEach((call, index) => {
        const host = index === 0 ? hostA : hostB
        assert.deepEqual(call, [
          'host.call_plugin',
          host.$ref,
          'sdncontroller.py',
          'add-rule',
          {
            bridge: 'xapi1',
            protocol: 'TCP',
            ipRange: '10.0.0.0/24',
            direction: 'to',
            mac: 'aa:bb:cc:dd:ee:ff',
            port: '22',
            allow: 'true',
            priority: '65000',
            cookie: '0x0123456789abcdef',
          },
        ])
      })
    })

    it('sends add-rule without mac for network entries', async () => {
      const plugin = new TrafficRulesPlugin()
      const calls = []
      hostA.$xapi.call = async (...args) => {
        calls.push(args)
      }

      const entry = {
        protocol: 'TCP',
        port: 443,
        ipRange: '192.168.0.0/16',
        direction: 'from',
        allow: false,
        priority: 50000,
        cookie: '0xfedcba9876543210',
      }

      await plugin.install(network, entry, [hostA])

      assert.equal(calls.length, 1)
      assert.deepEqual(calls[0][4], {
        bridge: 'xapi1',
        protocol: 'TCP',
        ipRange: '192.168.0.0/16',
        direction: 'from',
        port: '443',
        allow: 'false',
        priority: '50000',
        cookie: '0xfedcba9876543210',
      })
    })

    it('sends add-rule without port when entry has no port', async () => {
      const plugin = new TrafficRulesPlugin()
      const calls = []
      hostA.$xapi.call = async (...args) => {
        calls.push(args)
      }

      const entry = {
        protocol: 'ICMP',
        ipRange: '10.0.0.0/24',
        direction: 'to',
        allow: true,
        priority: 65000,
        cookie: '0x1111111111111111',
      }

      await plugin.install(network, entry, [hostA])

      assert.equal(calls.length, 1)
      assert(!('port' in calls[0][4]))
    })

    it('treats code 4 error as success in outcomes', async () => {
      const plugin = new TrafficRulesPlugin()
      hostA.$xapi.call = async () => {
        const error = new Error('No rules were build')
        error.code = '4'
        error.params = ['No rules were build']
        throw error
      }
      hostB.$xapi.call = async () => {}

      const entry = {
        protocol: 'TCP',
        port: 22,
        ipRange: '10.0.0.0/24',
        direction: 'to',
        allow: true,
        priority: 65000,
        cookie: '0x0123456789abcdef',
      }

      const outcomes = await plugin.install(network, entry, [hostA, hostB])

      assert.equal(outcomes.get(hostA.$ref), undefined)
      assert.equal(outcomes.get(hostB.$ref), undefined)
    })

    it('treats non-code-4 errors as failures in outcomes', async () => {
      const plugin = new TrafficRulesPlugin()
      const errorA = new Error('Some error')
      errorA.code = '3'
      errorA.params = ['Some error']
      const errorB = new Error('Parser error')
      errorB.code = '1'
      errorB.params = ['Parser error']
      hostA.$xapi.call = async () => {
        throw errorA
      }
      hostB.$xapi.call = async () => {
        throw errorB
      }

      const entry = {
        protocol: 'TCP',
        port: 22,
        ipRange: '10.0.0.0/24',
        direction: 'to',
        allow: true,
        priority: 65000,
        cookie: '0x0123456789abcdef',
      }

      const outcomes = await plugin.install(network, entry, [hostA, hostB])

      assert.deepEqual(outcomes.get(hostA.$ref), errorA)
      assert.deepEqual(outcomes.get(hostB.$ref), errorB)
    })
  })

  describe('deleteCookie', () => {
    it('sends del-rule with cookie and without allow/priority', async () => {
      const plugin = new TrafficRulesPlugin()
      const calls = []
      hostA.$xapi.call = async (...args) => {
        calls.push(args)
      }

      const rule = {
        mac: 'aa:bb:cc:dd:ee:ff',
        protocol: 'TCP',
        port: 22,
        ipRange: '10.0.0.0/24',
        direction: 'to',
      }

      await plugin.deleteCookie(network, rule, '0x0123456789abcdef', [hostA])

      assert.equal(calls.length, 1)
      const args = calls[0][4]
      assert('cookie' in args)
      assert(!('allow' in args))
      assert(!('priority' in args))
      assert.deepEqual(args, {
        bridge: 'xapi1',
        protocol: 'TCP',
        ipRange: '10.0.0.0/24',
        direction: 'to',
        mac: 'aa:bb:cc:dd:ee:ff',
        port: '22',
        cookie: '0x0123456789abcdef',
      })
    })
  })

  describe('deleteLegacy', () => {
    it('sends del-rule without cookie key', async () => {
      const plugin = new TrafficRulesPlugin()
      const calls = []
      hostA.$xapi.call = async (...args) => {
        calls.push(args)
      }

      const rule = {
        protocol: 'TCP',
        port: 22,
        ipRange: '10.0.0.0/24',
        direction: 'to',
      }

      await plugin.deleteLegacy(network, rule, [hostA])

      assert.equal(calls.length, 1)
      const args = calls[0][4]
      assert(!('cookie' in args))
      assert.deepEqual(args, {
        bridge: 'xapi1',
        protocol: 'TCP',
        ipRange: '10.0.0.0/24',
        direction: 'to',
        port: '22',
      })
    })
  })

  describe('supportsCookies', () => {
    it('returns true for cookie-aware plugin and caches result', async () => {
      const plugin = new TrafficRulesPlugin()
      const calls = []
      hostA.$xapi.call = async (...args) => {
        calls.push(args)
        const error = new Error("del_rule: Failed to get parameters: 'not-a-cookie' is not a valid cookie")
        error.code = '1'
        error.params = ["del_rule: Failed to get parameters: 'not-a-cookie' is not a valid cookie"]
        throw error
      }

      const result1 = await plugin.supportsCookies(hostA)
      const result2 = await plugin.supportsCookies(hostA)

      assert.equal(result1, true)
      assert.equal(result2, true)
      assert.equal(calls.length, 1)
    })

    it('returns false for old plugin and caches result', async () => {
      const plugin = new TrafficRulesPlugin()
      const calls = []
      hostA.$xapi.call = async (...args) => {
        calls.push(args)
      }

      const result1 = await plugin.supportsCookies(hostA)
      const result2 = await plugin.supportsCookies(hostA)

      assert.equal(result1, false)
      assert.equal(result2, false)
      assert.equal(calls.length, 1)
    })

    it('returns undefined when HOST_OFFLINE on all bridges and probes again', async () => {
      const plugin = new TrafficRulesPlugin()
      let callCount = 0
      hostA.$xapi.call = async () => {
        callCount++
        const error = new Error('Host unreachable')
        error.code = 'HOST_OFFLINE'
        error.params = ['Host unreachable']
        throw error
      }

      const result1 = await plugin.supportsCookies(hostA)
      assert.equal(result1, undefined)
      assert.equal(callCount, 1)

      const result2 = await plugin.supportsCookies(hostA)
      assert.equal(result2, undefined)
      assert.equal(callCount, 2)
    })

    it('skips bridges with other errors and continues probing', async () => {
      const hostWithTwoBridges = {
        uuid: 'uuid-c',
        $ref: 'ref-c',
        $PIFs: [{ $network: { bridge: 'bridge-1' } }, { $network: { bridge: 'bridge-2' } }],
        $xapi: { call: async () => {} },
      }

      const plugin = new TrafficRulesPlugin()
      const calls = []
      let callCount = 0
      hostWithTwoBridges.$xapi.call = async (...args) => {
        calls.push(args)
        callCount++
        if (callCount === 1) {
          const error = new Error('Some other error')
          error.code = '3'
          error.params = ['Some other error']
          throw error
        } else {
          const error = new Error("del_rule: Failed to get parameters: 'not-a-cookie' is not a valid cookie")
          error.code = '1'
          error.params = ["del_rule: Failed to get parameters: 'not-a-cookie' is not a valid cookie"]
          throw error
        }
      }

      const result = await plugin.supportsCookies(hostWithTwoBridges)

      assert.equal(result, true)
      assert.equal(calls.length, 2)
    })

    it('probes with correct arguments', async () => {
      const plugin = new TrafficRulesPlugin()
      const calls = []
      hostA.$xapi.call = async (...args) => {
        calls.push(args)
        const error = new Error('cookie error')
        error.code = '1'
        error.params = ['cookie error']
        throw error
      }

      await plugin.supportsCookies(hostA)

      assert.equal(calls.length, 1)
      const args = calls[0]
      assert.deepEqual(args[4], {
        bridge: 'xapi1',
        mac: '00:00:00:00:00:00',
        direction: 'to',
        protocol: 'ip',
        ipRange: '255.255.255.255',
        cookie: 'not-a-cookie',
      })
    })
  })

  describe('forgetHosts', () => {
    it('clears cached cookie support so next call probes again', async () => {
      const plugin = new TrafficRulesPlugin()
      let callCount = 0
      hostA.$xapi.call = async () => {
        callCount++
      }

      const result1 = await plugin.supportsCookies(hostA)
      assert.equal(result1, false)
      assert.equal(callCount, 1)

      plugin.forgetHosts([hostA])

      const result2 = await plugin.supportsCookies(hostA)
      assert.equal(result2, false)
      assert.equal(callCount, 2)
    })
  })
})
