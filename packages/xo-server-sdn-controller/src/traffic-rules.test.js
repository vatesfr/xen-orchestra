import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'
import { invalidParameters, noSuchObject, objectAlreadyExists } from 'xo-common/api-errors.js'
import { SDN_CONTROLLER_OF_RULES_KEY } from '@vates/types'

import { TrafficRules, listRules } from './traffic-rules.js'

const SSH = { allow: false, protocol: 'TCP', port: 22, ipRange: '10.0.0.0/8', direction: 'to' }
const WEB = { allow: true, protocol: 'TCP', port: 443, ipRange: '10.0.0.0/8', direction: 'to' }
const ICMP = { allow: true, protocol: 'ICMP', ipRange: '0.0.0.0/0', direction: 'from/to' }

function legacy(rules) {
  return JSON.stringify(rules.map(rule => JSON.stringify(rule)))
}

// A record with a writable other_config, which an update reaches after a turn of
// the event loop, as with XAPI
function createRecord(xapi, record, otherConfig = {}) {
  record.$xapi = xapi
  record.other_config = { ...otherConfig }
  record.update_other_config = async (key, value) => {
    await new Promise(resolve => setImmediate(resolve))
    if (value === null) {
      delete record.other_config[key]
    } else {
      record.other_config[key] = value
    }
  }
  xapi.records[record.$ref] = record
  return record
}

// One network on two hosts, with two VIFs: vif1 plugged, vif2 not. `failures`
// maps a host to the code its plugin calls fail with.
function setup({ networkConfig, vif1Config, vif2Config, failures = {} } = {}) {
  const calls = []
  const xapi = {
    records: {},
    async call(method, host, plugin, pluginMethod, args) {
      calls.push({ host, method: pluginMethod, args })
      if (failures[host] !== undefined) {
        throw Object.assign(new Error('plugin failed'), { code: failures[host] })
      }
    },
    getObjectByRef: ref => xapi.records[ref],
    barrier: async ref => xapi.records[ref],
  }
  const network = createRecord(
    xapi,
    { $id: 'net', $ref: 'net', $type: 'network', uuid: 'net', bridge: 'xenbr0' },
    networkConfig
  )
  network.$PIFs = ['host1', 'host2'].map($ref => ({ $host: { $ref, $xapi: xapi } }))
  const vm = { is_a_snapshot: false, is_a_template: false }
  const vif1 = createRecord(
    xapi,
    { $ref: 'vif1', $type: 'VIF', uuid: 'vif1', MAC: 'AA:BB:CC:DD:EE:01', currently_attached: true, $VM: vm },
    vif1Config
  )
  const vif2 = createRecord(
    xapi,
    { $ref: 'vif2', $type: 'VIF', uuid: 'vif2', MAC: 'AA:BB:CC:DD:EE:02', currently_attached: false, $VM: vm },
    vif2Config
  )
  vif1.$network = vif2.$network = network
  network.$VIFs = [vif1, vif2]
  return { calls, network, vif1, vif2, trafficRules: new TrafficRules() }
}

function rulesOf(owner) {
  const raw = owner.other_config[SDN_CONTROLLER_OF_RULES_KEY]
  return raw === undefined ? [] : JSON.parse(raw).map(JSON.parse)
}

// host, method, then the given plugin arguments, of each call
function summary(calls, ...fields) {
  return calls.map(({ host, method, args }) => [host, method, ...fields.map(field => args[field])])
}

describe('TrafficRules', () => {
  it('stores a rule on its owner, and installs it with its priority', async () => {
    const { calls, network, vif1, trafficRules } = setup()

    await trafficRules.addRule(network, { ...SSH, priority: 40000 })
    await trafficRules.addRule(vif1, { ...WEB, priority: 50000 })

    const [ssh] = rulesOf(network)
    assert.deepEqual(ssh, { ...SSH, priority: 40000, cookie: ssh.cookie })
    assert.match(ssh.cookie, /^0x[0-9a-f]{16}$/)
    // a VIF rule's cookie is not stored
    assert.deepEqual(rulesOf(vif1), [{ ...WEB, priority: 50000 }])

    const vifCookie = calls[2].args.cookie
    assert.match(vifCookie, /^0x[0-9a-f]{16}$/)
    assert.deepEqual(summary(calls, 'mac', 'priority', 'cookie'), [
      ['host1', 'add-rule', undefined, '40000', ssh.cookie],
      ['host2', 'add-rule', undefined, '40000', ssh.cookie],
      ['host1', 'add-rule', 'AA:BB:CC:DD:EE:01', '50000', vifCookie],
      ['host2', 'add-rule', 'AA:BB:CC:DD:EE:01', '50000', vifCookie],
    ])
  })

  it('appends a rule added without a priority after the last rule of the network', async () => {
    const { calls, network, vif1, vif2, trafficRules } = setup()

    await trafficRules.addRule(network, SSH)
    await trafficRules.addRule(vif1, WEB)
    await trafficRules.addRule(network, { ...ICMP, priority: 50000 })
    // an unplugged VIF counts too
    await trafficRules.addRule(vif2, { ...WEB, priority: 40000 })
    await trafficRules.addRule(vif1, SSH)

    assert.deepEqual(
      [...rulesOf(network), ...rulesOf(vif1)].map(rule => [rule.port, rule.priority]),
      [
        [22, 60000],
        [undefined, 50000],
        [443, 59995],
        [22, 39995],
      ]
    )
    assert.equal(calls[0].args.priority, '60000')
  })

  it('appends down to the lowest priority allowed, then answers 409', async () => {
    const { network, vif1, trafficRules } = setup()
    await trafficRules.addRule(network, { ...SSH, priority: 8006 })

    await trafficRules.addRule(vif1, WEB)
    assert.equal(rulesOf(vif1)[0].priority, 8002)

    await assert.rejects(trafficRules.addRule(vif1, SSH), error => objectAlreadyExists.is(error))
    assert.equal(rulesOf(vif1).length, 1)
  })

  it('accepts a priority from 8002 to 65535', async () => {
    const { network, trafficRules } = setup()

    await trafficRules.addRule(network, { ...SSH, priority: 8002 })
    await trafficRules.addRule(network, { ...WEB, priority: 32768 })
    await trafficRules.addRule(network, { ...ICMP, priority: 65535 })

    assert.deepEqual(
      rulesOf(network).map(rule => rule.priority),
      [65535, 32768, 8002]
    )
  })

  it('rejects a priority another rule of the network has, or an invalid one', async () => {
    const { calls, network, vif1, trafficRules } = setup()
    await trafficRules.addRule(network, { ...SSH, priority: 40000 })
    calls.length = 0

    await assert.rejects(trafficRules.addRule(vif1, { ...WEB, priority: 40000 }), error =>
      objectAlreadyExists.is(error)
    )
    // 8001 and below would tie with, or fall under, the flows of locked VIFs
    for (const priority of [1.5, -1, 8001, 65536]) {
      await assert.rejects(trafficRules.addRule(vif1, { ...WEB, priority }), error => invalidParameters.is(error))
    }
    assert.deepEqual(rulesOf(vif1), [])
    assert.deepEqual(calls, [])
  })

  it('checks a priority under the lock', async () => {
    const { network, vif1, trafficRules } = setup()

    const results = await Promise.allSettled([
      trafficRules.addRule(network, { ...SSH, priority: 40000 }),
      trafficRules.addRule(vif1, { ...WEB, priority: 40000 }),
    ])

    assert.deepEqual(
      results.map(({ status }) => status),
      ['fulfilled', 'rejected']
    )
  })

  it('changes the action of a rule with the same match in place, keeping its priority', async () => {
    const { network, trafficRules } = setup()
    await trafficRules.addRule(network, { ...SSH, priority: 40000 })
    const [ssh] = rulesOf(network)

    // as XO 5 would, without a priority
    await trafficRules.addRule(network, { ...SSH, protocol: 'tcp', allow: true })

    assert.deepEqual(rulesOf(network), [{ ...ssh, protocol: 'tcp', allow: true }])
  })

  it('saves the rule of an unplugged VIF without installing it', async () => {
    const { calls, vif2, trafficRules } = setup()

    await trafficRules.addRule(vif2, WEB)

    assert.deepEqual(rulesOf(vif2), [{ ...WEB, priority: 60000 }])
    assert.deepEqual(calls, [])
  })

  it('derives the cookie of a VIF rule from its MAC and its match', async () => {
    const { calls, vif1, vif2, trafficRules } = setup()
    await trafficRules.addRule(vif1, WEB)
    // a clone gets a copy of the rules of the VIF it was cloned from
    vif2.other_config = { ...vif1.other_config }
    vif2.currently_attached = true
    calls.length = 0

    await trafficRules.vifAttached(vif1)
    await trafficRules.vifAttached(vif2)

    const [vif1Cookie, vif2Cookie] = [calls[0], calls[2]].map(call => call.args.cookie)
    assert.notEqual(vif1Cookie, vif2Cookie)
    await trafficRules.vifAttached(vif1)
    assert.equal(calls[4].args.cookie, vif1Cookie)
  })

  it('moves a rule to another priority with its cookie', async () => {
    const { calls, network, trafficRules } = setup()
    await trafficRules.addRule(network, { ...SSH, priority: 40000 })
    const [ssh] = rulesOf(network)
    calls.length = 0

    await trafficRules.updateRule(network, SSH, { ...SSH, priority: 45000 })

    assert.deepEqual(rulesOf(network), [{ ...ssh, priority: 45000 }])
    assert.deepEqual(summary(calls, 'priority', 'cookie'), [
      ['host1', 'add-rule', '45000', ssh.cookie],
      ['host2', 'add-rule', '45000', ssh.cookie],
    ])
  })

  it('installs the new match of a VIF rule before deleting the old one', async () => {
    const { calls, vif1, trafficRules } = setup()
    await trafficRules.addRule(vif1, { ...WEB, priority: 50000 })
    const oldCookie = calls[0].args.cookie
    calls.length = 0

    await trafficRules.updateRule(vif1, WEB, { ...WEB, port: 8443, priority: 50000 })

    assert.deepEqual(rulesOf(vif1), [{ ...WEB, port: 8443, priority: 50000 }])
    const newCookie = calls[0].args.cookie
    assert.notEqual(newCookie, oldCookie)
    assert.deepEqual(summary(calls, 'port', 'cookie'), [
      ['host1', 'add-rule', '8443', newCookie],
      ['host2', 'add-rule', '8443', newCookie],
      ['host1', 'del-rule', '443', oldCookie],
      ['host2', 'del-rule', '443', oldCookie],
    ])
  })

  it('lets the copy of a clone change, but not move onto a taken priority', async () => {
    const { network, vif1, vif2, trafficRules } = setup()
    await trafficRules.addRule(network, { ...SSH, priority: 40000 })
    await trafficRules.addRule(vif1, { ...WEB, priority: 50000 })
    vif2.other_config = { ...vif1.other_config }

    await trafficRules.updateRule(vif2, WEB, { ...WEB, allow: false, priority: 50000 })
    assert.deepEqual(rulesOf(vif2), [{ ...WEB, allow: false, priority: 50000 }])

    await assert.rejects(trafficRules.updateRule(vif2, WEB, { ...WEB, priority: 40000 }), error =>
      objectAlreadyExists.is(error)
    )
  })

  it('moves a rule updated without a priority after the last rule of the network', async () => {
    const { network, vif1, trafficRules } = setup()
    await trafficRules.addRule(network, { ...SSH, priority: 40000 })
    await trafficRules.addRule(vif1, { ...WEB, priority: 30000 })

    await trafficRules.updateRule(network, SSH, SSH)
    assert.equal(rulesOf(network)[0].priority, 29995)

    // the last rule already, which does not count itself
    await trafficRules.updateRule(network, SSH, SSH)
    assert.equal(rulesOf(network)[0].priority, 29995)
  })

  it('rejects updating a missing rule, or onto the match of another rule', async () => {
    const { network, trafficRules } = setup()
    await trafficRules.addRule(network, SSH)
    await trafficRules.addRule(network, WEB)

    await assert.rejects(trafficRules.updateRule(network, ICMP, SSH), error => noSuchObject.is(error))
    await assert.rejects(trafficRules.updateRule(network, SSH, WEB), error => objectAlreadyExists.is(error))
  })

  it('deletes a rule by its cookie, and ignores a missing one', async () => {
    const { calls, network, trafficRules } = setup()
    await trafficRules.addRule(network, SSH)
    const [ssh] = rulesOf(network)
    calls.length = 0

    await trafficRules.deleteRule(network, { ...SSH, allow: undefined })
    await trafficRules.deleteRule(network, WEB)

    assert.deepEqual(rulesOf(network), [])
    assert.equal(network.other_config[SDN_CONTROLLER_OF_RULES_KEY], undefined)
    assert.deepEqual(summary(calls, 'cookie'), [
      ['host1', 'del-rule', ssh.cookie],
      ['host2', 'del-rule', ssh.cookie],
    ])
  })

  it('removes the rules of a detached VIF, and refreshes the network rules', async () => {
    const { calls, network, vif1, trafficRules } = setup()
    await trafficRules.addRule(network, SSH)
    await trafficRules.addRule(vif1, WEB)
    const [ssh] = rulesOf(network)
    const vifCookie = calls[2].args.cookie
    calls.length = 0

    await trafficRules.vifDetached(vif1)

    assert.deepEqual(summary(calls, 'cookie'), [
      ['host1', 'del-rule', vifCookie],
      ['host2', 'del-rule', vifCookie],
      ['host1', 'add-rule', ssh.cookie],
      ['host2', 'add-rule', ssh.cookie],
    ])
  })

  it('refreshes the rules of a network from before priorities', async () => {
    const { calls, network, vif1, vif2, trafficRules } = setup({
      // a network rule from before cookies
      networkConfig: { [SDN_CONTROLLER_OF_RULES_KEY]: legacy([SSH]) },
      vif1Config: { [SDN_CONTROLLER_OF_RULES_KEY]: legacy([WEB]) },
      vif2Config: { [SDN_CONTROLLER_OF_RULES_KEY]: legacy([ICMP]) },
    })

    await trafficRules.refresh(network)

    // numbered as if appended, network rules first
    const [ssh] = rulesOf(network)
    assert.match(ssh.cookie, /^0x[0-9a-f]{16}$/)
    assert.deepEqual(
      [ssh, ...rulesOf(vif1), ...rulesOf(vif2)].map(rule => rule.priority),
      [60000, 59995, 59990]
    )
    // the legacy flows go first: older plugins delete by match whatever the cookie
    const rows = summary(calls, 'mac', 'port', 'priority', 'cookie')
    const [webCookie, icmpCookie] = [rows[6][5], rows[10][5]]
    assert.deepEqual(rows, [
      // the network rule
      ['host1', 'del-rule', undefined, '22', undefined, undefined],
      ['host2', 'del-rule', undefined, '22', undefined, undefined],
      ['host1', 'add-rule', undefined, '22', '60000', ssh.cookie],
      ['host2', 'add-rule', undefined, '22', '60000', ssh.cookie],
      // plugged vif1: installed
      ['host1', 'del-rule', 'AA:BB:CC:DD:EE:01', '443', undefined, undefined],
      ['host2', 'del-rule', 'AA:BB:CC:DD:EE:01', '443', undefined, undefined],
      ['host1', 'add-rule', 'AA:BB:CC:DD:EE:01', '443', '59995', webCookie],
      ['host2', 'add-rule', 'AA:BB:CC:DD:EE:01', '443', '59995', webCookie],
      // unplugged vif2: removed
      ['host1', 'del-rule', 'AA:BB:CC:DD:EE:02', undefined, undefined, undefined],
      ['host2', 'del-rule', 'AA:BB:CC:DD:EE:02', undefined, undefined, undefined],
      ['host1', 'del-rule', 'AA:BB:CC:DD:EE:02', undefined, undefined, icmpCookie],
      ['host2', 'del-rule', 'AA:BB:CC:DD:EE:02', undefined, undefined, icmpCookie],
    ])
  })

  it('installs a rule from before priorities at 8001 when none is left to number it', async () => {
    const { calls, network, vif1, trafficRules } = setup({
      vif1Config: { [SDN_CONTROLLER_OF_RULES_KEY]: legacy([WEB]) },
    })
    await trafficRules.addRule(network, { ...SSH, priority: 8002 })
    calls.length = 0

    await trafficRules.refresh(network)

    assert.deepEqual(rulesOf(vif1), [WEB])
    assert.equal(calls.find(call => call.args.mac !== undefined && call.method === 'add-rule').args.priority, '8001')
  })

  it('reads two legacy rules with the same match as the last one', async () => {
    const { vif1, trafficRules } = setup({
      vif1Config: { [SDN_CONTROLLER_OF_RULES_KEY]: legacy([WEB, { ...WEB, allow: false }]) },
    })

    await trafficRules.addRule(vif1, SSH)

    assert.deepEqual(
      rulesOf(vif1).map(rule => [rule.port, rule.allow]),
      [
        [22, false],
        [443, false],
      ]
    )
  })

  it('writes the rules of an owner highest priority first', async () => {
    const { network, trafficRules } = setup()

    await trafficRules.addRule(network, { ...SSH, priority: 40000 })
    await trafficRules.addRule(network, WEB)
    await trafficRules.addRule(network, { ...ICMP, priority: 50000 })

    assert.deepEqual(
      rulesOf(network).map(rule => rule.priority),
      [50000, 40000, 39995]
    )
  })

  it('ignores hosts where a network rule builds no flow', async () => {
    const { network, trafficRules } = setup({ failures: { host2: '4' } })

    await trafficRules.addRule(network, SSH)

    assert.equal(rulesOf(network).length, 1)
  })

  it('keeps a rule that failed on some host, and throws', async () => {
    const { network, trafficRules } = setup({ failures: { host2: '3' } })

    await assert.rejects(trafficRules.addRule(network, SSH))

    assert.equal(rulesOf(network).length, 1)
  })
})

describe('listRules', () => {
  it('lists the rules of a network and of its VIFs, highest priority first', async () => {
    const { network, vif1, trafficRules } = setup({
      // from before priorities: last
      vif2Config: { [SDN_CONTROLLER_OF_RULES_KEY]: legacy([ICMP]) },
    })
    await trafficRules.addRule(network, { ...SSH, priority: 40000 })
    await trafficRules.addRule(vif1, { ...WEB, priority: 50000 })
    // a snapshot keeps a copy of the VIF, which never applies
    const snapshotVif = { ...vif1, $ref: 'snapshot-vif', uuid: 'snapshot-vif', $VM: { is_a_snapshot: true } }
    network.$VIFs.push(snapshotVif)

    assert.deepEqual(listRules(network), [
      { ...WEB, priority: 50000, type: 'VIF', sourceId: 'vif1', networkId: 'net', active: true },
      { ...SSH, priority: 40000, type: 'network', sourceId: 'net', networkId: 'net', active: true },
      { ...ICMP, port: undefined, priority: undefined, type: 'VIF', sourceId: 'vif2', networkId: 'net', active: false },
    ])
  })

  it('lists the rules of the same priority network rules first, then in the order of the VIFs', async () => {
    const { network, vif1, vif2, trafficRules } = setup()
    await trafficRules.addRule(vif2, { ...WEB, priority: 40000 })
    // a clone copies the priorities of its rules
    vif1.other_config = { ...vif2.other_config }
    network.other_config = { [SDN_CONTROLLER_OF_RULES_KEY]: legacy([{ ...SSH, priority: 40000 }]) }

    assert.deepEqual(
      listRules(network).map(rule => rule.sourceId),
      ['net', 'vif1', 'vif2']
    )
  })
})
