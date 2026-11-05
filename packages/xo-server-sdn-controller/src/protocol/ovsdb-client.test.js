import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import { OvsdbClient, protocolsMutations, repairProtocolsMutations } from './ovsdb-client.js'

describe('protocolsMutations', () => {
  it("leaves a bridge with none set alone: OVS's defaults already include OpenFlow 1.1", () => {
    assert.deepEqual(protocolsMutations([]), [])
  })

  it('leaves a bridge that already accepts OpenFlow 1.1 alone', () => {
    assert.deepEqual(protocolsMutations(['OpenFlow10', 'OpenFlow11']), [])
  })

  it("adds OpenFlow11 to a bridge's protocols that lack it, keeping them", () => {
    assert.deepEqual(protocolsMutations(['OpenFlow10', 'OpenFlow14']), [['protocols', 'insert', 'OpenFlow11']])
  })
})

describe('repairProtocolsMutations', () => {
  it('gives OpenFlow 1.0 back to a bridge an older XO restricted to OpenFlow 1.1', () => {
    assert.deepEqual(repairProtocolsMutations(['OpenFlow11']), [['protocols', 'insert', 'OpenFlow10']])
  })

  it('leaves any other set alone', () => {
    for (const protocols of [[], ['OpenFlow10', 'OpenFlow11'], ['OpenFlow13'], ['OpenFlow11', 'OpenFlow13']]) {
      assert.deepEqual(repairProtocolsMutations(protocols), [])
    }
  })
})

describe('a bridge XO already controls', () => {
  // an OVSDB client whose bridge is controlled, with `protocols`, recording the transactions sent
  function makeClient(protocols) {
    const client = new OvsdbClient({ name_label: 'host', $PIFs: [{ $network: { uuid: 'net', name_label: 'net' } }] })
    const transactions = []
    client._connect = async () => ({ destroy() {} })
    client._controllerUuid = 'controller'
    client._getBridgeForNetwork = async () => ({ uuid: 'bridge', name: 'xenbr0' })
    client._bridgeAlreadyControlled = async () => true
    client._bridgeProtocols = async () => protocols
    client._sendOvsdbTransaction = async params => {
      transactions.push(params)
      return [{ error: null, result: [{ uuid: ['uuid', 'controller'] }] }]
    }
    return { client, transactions }
  }

  const repair = {
    op: 'mutate',
    table: 'Bridge',
    where: [['_uuid', '==', ['uuid', 'bridge']]],
    mutations: [['protocols', 'insert', 'OpenFlow10']],
  }

  it('gets OpenFlow 1.0 back when the controller of the host is set', async () => {
    const { client, transactions } = makeClient(['OpenFlow11'])
    await client.setBridgeController()
    assert.deepEqual(transactions[0].slice(2), [repair])
  })

  it('gets OpenFlow 1.0 back when the controller of its network is set', async () => {
    const { client, transactions } = makeClient(['OpenFlow11'])
    await client.setBridgeControllerForNetwork({ uuid: 'net', name_label: 'net' })
    assert.deepEqual(transactions, [['Open_vSwitch', repair]])
  })

  it('is otherwise left alone', async () => {
    const { client, transactions } = makeClient([])
    await client.setBridgeController()
    await client.setBridgeControllerForNetwork({ uuid: 'net', name_label: 'net' })
    // only the insertion of the controller row
    assert.equal(transactions.length, 1)
    assert.equal(transactions[0].length, 2)
  })
})
