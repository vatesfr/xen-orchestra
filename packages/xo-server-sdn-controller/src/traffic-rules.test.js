import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'
import { noSuchObject, objectAlreadyExists } from 'xo-common/api-errors.js'
import { SDN_CONTROLLER_OF_RULES_KEY } from '@vates/types'

import { TrafficRules, listRules } from './traffic-rules.js'

const SSH = { allow: false, protocol: 'TCP', port: 22, ipRange: '10.0.0.0/8', direction: 'to' }
const WEB = { allow: true, protocol: 'TCP', port: 443, ipRange: '10.0.0.0/8', direction: 'to' }
const ICMP = { allow: true, protocol: 'ICMP', ipRange: '0.0.0.0/0', direction: 'from/to' }

function legacy(rules) {
  return JSON.stringify(rules.map(rule => JSON.stringify(rule)))
}

// A record with a writable other_config: like XAPI, an update takes a turn of the event loop
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

function ofPriorities(owner) {
  return rulesOf(owner).map(rule => rule.ofPriority)
}

// host, method, then the given plugin arguments, of each call
function summary(calls, ...fields) {
  return calls.map(({ host, method, args }) => [host, method, ...fields.map(field => args[field])])
}

describe('TrafficRules', () => {
  it('stores a rule on its owner with its OpenFlow priority, and installs it', async () => {
    const { calls, network, vif1, trafficRules } = setup()

    assert.equal(await trafficRules.addRule(network, SSH), 1)
    assert.equal(await trafficRules.addRule(vif1, { ...WEB, priority: 1 }), 1)

    const [ssh] = rulesOf(network)
    assert.deepEqual(ssh, { ...SSH, ofPriority: 60000, cookie: ssh.cookie })
    assert.match(ssh.cookie, /^0x[0-9a-f]{16}$/)
    // a VIF rule's cookie is not stored
    assert.deepEqual(rulesOf(vif1), [{ ...WEB, ofPriority: 60005 }])

    const vifCookie = calls[2].args.cookie
    assert.match(vifCookie, /^0x[0-9a-f]{16}$/)
    assert.deepEqual(summary(calls, 'mac', 'priority', 'cookie'), [
      ['host1', 'add-rule', undefined, '60000', ssh.cookie],
      ['host2', 'add-rule', undefined, '60000', ssh.cookie],
      ['host1', 'add-rule', 'AA:BB:CC:DD:EE:01', '60005', vifCookie],
      ['host2', 'add-rule', 'AA:BB:CC:DD:EE:01', '60005', vifCookie],
    ])
  })

  it('puts a rule added without a priority after the last rule of the network', async () => {
    const { network, vif1, vif2, trafficRules } = setup()

    await trafficRules.addRule(network, SSH)
    await trafficRules.addRule(vif1, WEB)
    // an unplugged VIF counts too
    await trafficRules.addRule(vif2, ICMP)
    assert.equal(await trafficRules.addRule(vif1, SSH), 4)

    const rules = [...rulesOf(network), ...rulesOf(vif1), ...rulesOf(vif2)]
    const rows = rules.map(rule => [rule.protocol, rule.port, rule.ofPriority])
    assert.deepEqual(rows, [
      ['TCP', 22, 60000],
      ['TCP', 443, 59995],
      ['TCP', 22, 59985],
      ['ICMP', undefined, 59990],
    ])
  })

  it('inserts a rule at its rank, before the rule which had it', async () => {
    const { network, vif1, trafficRules } = setup()
    await trafficRules.addRule(network, SSH)
    await trafficRules.addRule(vif1, WEB)

    assert.equal(await trafficRules.addRule(network, { ...ICMP, priority: 2 }), 2)

    assert.deepEqual(ofPriorities(network), [60000, 59997])
    const ranks = listRules(network).map(rule => [rule.protocol, rule.priority])
    assert.deepEqual(ranks, [
      ['TCP', 1],
      ['ICMP', 2],
      ['TCP', 3],
    ])
  })

  it('puts a rule given a rank past the last one last', async () => {
    const { network, trafficRules } = setup()
    await trafficRules.addRule(network, SSH)

    assert.equal(await trafficRules.addRule(network, { ...WEB, priority: 50 }), 2)
    assert.deepEqual(ofPriorities(network), [60000, 59995])
  })

  it('spreads the priorities of the network again when none is free at the rank', async () => {
    const { calls, network, vif1, vif2, trafficRules } = setup({
      networkConfig: { [SDN_CONTROLLER_OF_RULES_KEY]: legacy([{ ...SSH, ofPriority: 60000, cookie: '0x01' }]) },
      vif1Config: { [SDN_CONTROLLER_OF_RULES_KEY]: legacy([{ ...WEB, ofPriority: 59999 }]) },
      // the copy of a clone, unplugged
      vif2Config: { [SDN_CONTROLLER_OF_RULES_KEY]: legacy([{ ...WEB, ofPriority: 59999 }]) },
    })

    assert.equal(await trafficRules.addRule(network, { ...ICMP, priority: 2 }), 2)

    // two priorities were taken, now as far apart as (60000 - 8001) / 3 lets them:
    // the order and the tie are kept
    const rows = [...rulesOf(network), ...rulesOf(vif1), ...rulesOf(vif2)].map(rule => [rule.protocol, rule.ofPriority])
    assert.deepEqual(rows, [
      ['TCP', 60000],
      ['ICMP', 51333],
      ['TCP', 42667],
      ['TCP', 42667],
    ])
    // the moved rule of the plugged VIF is installed again
    assert.deepEqual(summary(calls, 'mac', 'priority'), [
      ['host1', 'add-rule', undefined, '51333'],
      ['host2', 'add-rule', undefined, '51333'],
      ['host1', 'add-rule', 'AA:BB:CC:DD:EE:01', '42667'],
      ['host2', 'add-rule', 'AA:BB:CC:DD:EE:01', '42667'],
    ])
  })

  it('places rules added at the same time one after the other, under the lock', async () => {
    const { network, vif1, trafficRules } = setup()

    const ranks = await Promise.all([
      trafficRules.addRule(network, { ...SSH, priority: 1 }),
      trafficRules.addRule(vif1, { ...WEB, priority: 1 }),
    ])

    assert.deepEqual(ranks, [1, 1])
    const sourceIds = listRules(network).map(rule => rule.sourceId)
    assert.deepEqual(sourceIds, ['vif1', 'net'])
  })

  it('changes the action of a rule with the same match in place, keeping its place', async () => {
    const { network, trafficRules } = setup()
    await trafficRules.addRule(network, SSH)
    const [ssh] = rulesOf(network)

    // as XO 5 would, without a priority
    await trafficRules.addRule(network, { ...SSH, protocol: 'tcp', allow: true })

    assert.deepEqual(rulesOf(network), [{ ...ssh, protocol: 'tcp', allow: true }])
  })

  it('saves the rule of an unplugged VIF without installing it', async () => {
    const { calls, vif2, trafficRules } = setup()

    await trafficRules.addRule(vif2, WEB)

    assert.deepEqual(rulesOf(vif2), [{ ...WEB, ofPriority: 60000 }])
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
    await trafficRules.vifAttached(vif1)

    // sha256 of the lowercased MAC and match, as cookieOf derives it: the copy
    // on the other MAC gets another cookie, the same rule the same one, even when attached again
    assert.deepEqual(summary(calls, 'mac', 'cookie'), [
      ['host1', 'add-rule', 'AA:BB:CC:DD:EE:01', '0x4ced69ba7c11a9c9'],
      ['host2', 'add-rule', 'AA:BB:CC:DD:EE:01', '0x4ced69ba7c11a9c9'],
      ['host1', 'add-rule', 'AA:BB:CC:DD:EE:02', '0xa7aa3bf6fa745d96'],
      ['host2', 'add-rule', 'AA:BB:CC:DD:EE:02', '0xa7aa3bf6fa745d96'],
      ['host1', 'add-rule', 'AA:BB:CC:DD:EE:01', '0x4ced69ba7c11a9c9'],
      ['host2', 'add-rule', 'AA:BB:CC:DD:EE:01', '0x4ced69ba7c11a9c9'],
    ])
  })

  it('moves a rule to another rank with its cookie', async () => {
    const { calls, network, vif1, trafficRules } = setup()
    await trafficRules.addRule(network, SSH)
    await trafficRules.addRule(vif1, WEB)
    const [ssh] = rulesOf(network)
    calls.length = 0

    assert.equal(await trafficRules.updateRule(network, SSH, { ...SSH, priority: 2 }), 2)

    assert.deepEqual(rulesOf(network), [{ ...ssh, ofPriority: 59990 }])
    assert.deepEqual(summary(calls, 'priority', 'cookie'), [
      ['host1', 'add-rule', '59990', ssh.cookie],
      ['host2', 'add-rule', '59990', ssh.cookie],
    ])
  })

  it('installs the new match of a VIF rule before deleting the old one', async () => {
    const { calls, vif1, trafficRules } = setup()
    await trafficRules.addRule(vif1, WEB)
    const oldCookie = calls[0].args.cookie
    calls.length = 0

    await trafficRules.updateRule(vif1, WEB, { ...WEB, port: 8443 })

    assert.deepEqual(rulesOf(vif1), [{ ...WEB, port: 8443, ofPriority: 60000 }])
    // sha256 of the lowercased MAC and the new match, as cookieOf derives it
    const newCookie = calls[0].args.cookie
    assert.equal(newCookie, '0x10c56ebb2a800577')
    assert.notEqual(newCookie, oldCookie)
    assert.deepEqual(summary(calls, 'port', 'cookie'), [
      ['host1', 'add-rule', '8443', newCookie],
      ['host2', 'add-rule', '8443', newCookie],
      ['host1', 'del-rule', '443', oldCookie],
      ['host2', 'del-rule', '443', oldCookie],
    ])
  })

  it('lets the copy of a clone change without moving, or move before its original', async () => {
    const { network, vif1, vif2, trafficRules } = setup()
    await trafficRules.addRule(network, SSH)
    await trafficRules.addRule(vif1, WEB)
    vif2.other_config = { ...vif1.other_config }

    assert.equal(await trafficRules.updateRule(vif2, WEB, { ...WEB, allow: false }), 2)
    assert.deepEqual(rulesOf(vif2), [{ ...WEB, allow: false, ofPriority: 59995 }])

    assert.equal(await trafficRules.updateRule(vif2, WEB, { ...WEB, priority: 2 }), 2)
    const ranks = listRules(network).map(rule => [rule.sourceId, rule.priority])
    assert.deepEqual(ranks, [
      ['net', 1],
      ['vif2', 2],
      ['vif1', 3],
    ])
  })

  it('moves a rule updated with a null priority after the last rule of the network', async () => {
    const { network, vif1, trafficRules } = setup()
    await trafficRules.addRule(network, SSH)
    await trafficRules.addRule(vif1, WEB)

    assert.equal(await trafficRules.updateRule(network, SSH, { ...SSH, priority: null }), 2)
    assert.equal(rulesOf(network)[0].ofPriority, 59990)

    // the last rule already: it stays where it is
    await trafficRules.updateRule(network, SSH, { ...SSH, priority: null })
    assert.equal(rulesOf(network)[0].ofPriority, 59990)
  })

  it('keeps the place of a rule updated without a priority', async () => {
    const { network, trafficRules } = setup()
    await trafficRules.addRule(network, SSH)
    await trafficRules.addRule(network, { ...WEB, priority: 1 })

    assert.equal(await trafficRules.updateRule(network, SSH, { ...SSH, allow: true }), 2)

    const rows = rulesOf(network).map(rule => [rule.port, rule.ofPriority])
    assert.deepEqual(rows, [
      [443, 60005],
      [22, 60000],
    ])
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
    const priorities = [ssh, ...rulesOf(vif1), ...rulesOf(vif2)].map(rule => rule.ofPriority)
    assert.deepEqual(priorities, [60000, 59995, 59990])
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

  it('installs a rule from before priorities at 8001 until it is numbered', async () => {
    const { calls, vif1, trafficRules } = setup({
      vif1Config: { [SDN_CONTROLLER_OF_RULES_KEY]: legacy([WEB]) },
    })

    await trafficRules.vifAttached(vif1)

    assert.deepEqual(rulesOf(vif1), [WEB])
    assert.equal(calls[0].args.priority, '8001')
  })

  it('reads two legacy rules with the same match as the last one', async () => {
    const { vif1, trafficRules } = setup({
      vif1Config: { [SDN_CONTROLLER_OF_RULES_KEY]: legacy([WEB, { ...WEB, allow: false }]) },
    })

    await trafficRules.addRule(vif1, SSH)

    const actions = rulesOf(vif1).map(rule => [rule.port, rule.allow])
    assert.deepEqual(actions, [
      [22, false],
      [443, false],
    ])
  })

  it('writes the rules of an owner highest priority first', async () => {
    const { network, trafficRules } = setup()

    await trafficRules.addRule(network, SSH)
    await trafficRules.addRule(network, WEB)
    await trafficRules.addRule(network, { ...ICMP, priority: 1 })

    assert.deepEqual(ofPriorities(network), [60005, 60000, 59995])
  })

  it('ignores hosts where a network rule builds no flow', async () => {
    const { network, trafficRules } = setup({ failures: { host2: '4' } })

    await trafficRules.addRule(network, SSH)

    assert.equal(rulesOf(network).length, 1)
  })

  it('fails on a VIF rule that a host rejects with code 4, which only a network rule can get', async () => {
    const { vif1, trafficRules } = setup({ failures: { host2: '4' } })

    await assert.rejects(
      trafficRules.addRule(vif1, SSH),
      // `callPlugin` gathers the failures of every host
      ({ errors }) => errors.length === 1 && errors[0].code === '4' && errors[0].message === 'plugin failed'
    )

    assert.equal(rulesOf(vif1).length, 1)
  })

  it('ignores an offline host, which restarts without any flow', async () => {
    const { network, trafficRules } = setup({ failures: { host2: 'HOST_OFFLINE' } })

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
  it('lists the rules of a network and of its VIFs by rank', async () => {
    const { network, vif1, trafficRules } = setup({
      // from before priorities: last
      vif2Config: { [SDN_CONTROLLER_OF_RULES_KEY]: legacy([ICMP]) },
    })
    await trafficRules.addRule(network, SSH)
    await trafficRules.addRule(vif1, { ...WEB, priority: 1 })
    // a snapshot keeps a copy of the VIF, which never applies
    const snapshotVif = { ...vif1, $ref: 'snapshot-vif', uuid: 'snapshot-vif', $VM: { is_a_snapshot: true } }
    network.$VIFs.push(snapshotVif)

    assert.deepEqual(listRules(network), [
      { ...WEB, priority: 1, type: 'VIF', sourceId: 'vif1', networkId: 'net', active: true },
      { ...SSH, priority: 2, type: 'network', sourceId: 'net', networkId: 'net', active: true },
      { ...ICMP, port: undefined, priority: 3, type: 'VIF', sourceId: 'vif2', networkId: 'net', active: false },
    ])
  })

  it('lists the rules of the same rank network rules first, then in the order of the VIFs', () => {
    // a clone copies the priorities of its rules
    const vifConfig = { [SDN_CONTROLLER_OF_RULES_KEY]: legacy([{ ...WEB, ofPriority: 40000 }]) }
    const { network } = setup({
      networkConfig: { [SDN_CONTROLLER_OF_RULES_KEY]: legacy([{ ...SSH, ofPriority: 40000 }]) },
      vif1Config: vifConfig,
      vif2Config: vifConfig,
    })

    const ranks = listRules(network).map(rule => [rule.sourceId, rule.priority])
    assert.deepEqual(ranks, [
      ['net', 1],
      ['vif1', 1],
      ['vif2', 1],
    ])
  })
})
