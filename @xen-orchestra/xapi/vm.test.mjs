import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'

import Vm from './vm.mjs'

// fake XAPI with one VM whose disks are given as chains of VDIs, leaf first:
// the leaf is managed, its ancestors are not
//
// a chain of 3 (leaf, parent, grand-parent) is unhealthy with a tolerance of 0:
// the grand-parent has a single unmanaged child, they should have coalesced
function makeXapi({ chains, gcTasks = [], scanFails = false, scanning = [] }) {
  const vdis = {}
  const srVdis = {}
  const vbds = []
  chains.forEach(({ sr, length }, i) => {
    let parentUuid
    for (let j = length - 1; j >= 0; --j) {
      const uuid = `vdi-${i}-${j}`
      const vdi = {
        $ref: `OpaqueRef:${uuid}`,
        uuid,
        SR: sr,
        managed: j === 0,
        sm_config: parentUuid === undefined ? {} : { 'vhd-parent': parentUuid },
      }
      vdis[vdi.$ref] = vdi
      if (srVdis[sr] === undefined) {
        srVdis[sr] = []
      }
      srVdis[sr].push(vdi.$ref)
      parentUuid = uuid
    }
    vbds.push({ VDI: `OpaqueRef:vdi-${i}-0` })
  })

  const calls = []
  const warnings = []
  const xapi = {
    calls,
    warnings,
    objects: {
      all: Object.fromEntries(
        gcTasks.map((srUuid, i) => [
          `task${i}`,
          {
            $type: 'task',
            status: 'pending',
            name_label: 'Garbage Collection',
            name_description: `Garbage collection for SR ${srUuid}`,
          },
        ])
      ),
    },
    async call(method, ...args) {
      calls.push([method, ...args])
      return 'OpaqueRef:scan-task'
    },
    async watchTask() {
      if (scanFails) {
        throw new Error('SR_BACKEND_FAILURE')
      }
    },
    async getField(type, ref, field) {
      if (type === 'VM' && field === 'VBDs') return vbds.map((_, i) => `OpaqueRef:vbd-${i}`)
      if (type === 'SR' && field === 'VDIs') return srVdis[ref] ?? []
      throw new Error(`unexpected getField(${type}, ${ref}, ${field})`)
    },
    async getRecords(type) {
      assert.equal(type, 'VBD')
      return vbds
    },
    async getRecord(type, ref) {
      if (type === 'VDI') return vdis[ref]
      if (type === 'SR') {
        return {
          uuid: `uuid-of-${ref}`,
          current_operations: scanning.includes(ref) ? { 'OpaqueRef:t': 'scan' } : {},
        }
      }
      throw new Error(`unexpected getRecord(${type}, ${ref})`)
    },
    async getRecordByUuid(type, uuid) {
      assert.equal(type, 'VDI')
      return Object.values(vdis).find(vdi => vdi.uuid === uuid)
    },
  }
  for (const name of ['_assertHealthyVdiChain', '_kickSrGarbageCollector', 'assertHealthyVdiChains']) {
    xapi[name] = Vm.prototype[name]
  }
  return xapi
}

const scans = xapi => xapi.calls.filter(([method]) => method === 'Async.SR.scan')

describe('assertHealthyVdiChains()', () => {
  it('does not scan when the chains are healthy', async () => {
    const xapi = makeXapi({ chains: [{ sr: 'OpaqueRef:sr1', length: 2 }] })
    await xapi.assertHealthyVdiChains('OpaqueRef:vm', 0)
    assert.deepEqual(scans(xapi), [])
  })

  it('scans the SR of an unhealthy chain and still rejects', async () => {
    const xapi = makeXapi({ chains: [{ sr: 'OpaqueRef:sr1', length: 3 }] })
    await assert.rejects(xapi.assertHealthyVdiChains('OpaqueRef:vm', 0), { message: 'unhealthy VDI chain' })
    assert.deepEqual(scans(xapi), [['Async.SR.scan', 'OpaqueRef:sr1']])
  })

  it('scans every SR with an unhealthy chain, once', async () => {
    const xapi = makeXapi({
      chains: [
        { sr: 'OpaqueRef:sr1', length: 3 },
        { sr: 'OpaqueRef:sr2', length: 2 },
        { sr: 'OpaqueRef:sr3', length: 3 },
        { sr: 'OpaqueRef:sr1', length: 3 },
      ],
    })
    await assert.rejects(xapi.assertHealthyVdiChains('OpaqueRef:vm', 0), { message: 'unhealthy VDI chain' })
    assert.deepEqual(scans(xapi), [
      ['Async.SR.scan', 'OpaqueRef:sr1'],
      ['Async.SR.scan', 'OpaqueRef:sr3'],
    ])
  })

  it('does not scan an SR whose garbage collector is running', async () => {
    const xapi = makeXapi({ chains: [{ sr: 'OpaqueRef:sr1', length: 3 }], gcTasks: ['uuid-of-OpaqueRef:sr1'] })
    await assert.rejects(xapi.assertHealthyVdiChains('OpaqueRef:vm', 0), { message: 'unhealthy VDI chain' })
    assert.deepEqual(scans(xapi), [])
  })

  it('scans an SR when the running garbage collector is for another SR', async () => {
    const xapi = makeXapi({ chains: [{ sr: 'OpaqueRef:sr1', length: 3 }], gcTasks: ['uuid-of-OpaqueRef:sr2'] })
    await assert.rejects(xapi.assertHealthyVdiChains('OpaqueRef:vm', 0), { message: 'unhealthy VDI chain' })
    assert.deepEqual(scans(xapi), [['Async.SR.scan', 'OpaqueRef:sr1']])
  })

  it('does not scan an SR which is already being scanned', async () => {
    const xapi = makeXapi({ chains: [{ sr: 'OpaqueRef:sr1', length: 3 }], scanning: ['OpaqueRef:sr1'] })
    await assert.rejects(xapi.assertHealthyVdiChains('OpaqueRef:vm', 0), { message: 'unhealthy VDI chain' })
    assert.deepEqual(scans(xapi), [])
  })

  it('scans an SR at most once per interval', async t => {
    t.mock.timers.enable({ apis: ['Date'], now: 0 })
    const xapi = makeXapi({ chains: [{ sr: 'OpaqueRef:sr1', length: 3 }] })
    const check = () => assert.rejects(xapi.assertHealthyVdiChains('OpaqueRef:vm', 0))

    await check()
    await check()
    assert.equal(scans(xapi).length, 1)

    t.mock.timers.tick(10 * 60e3 - 1)
    await check()
    assert.equal(scans(xapi).length, 1)

    t.mock.timers.tick(1)
    await check()
    assert.equal(scans(xapi).length, 2)
  })

  it('still rejects with the chain error when the scan cannot be started', async () => {
    const xapi = makeXapi({ chains: [{ sr: 'OpaqueRef:sr1', length: 3 }] })
    xapi.call = async () => {
      throw new Error('cannot call Async.SR.scan() in read only mode')
    }
    await assert.rejects(xapi.assertHealthyVdiChains('OpaqueRef:vm', 0), { message: 'unhealthy VDI chain' })
  })

  it('does not leave an unhandled rejection when the scan fails', async () => {
    const unhandled = []
    const onUnhandled = error => unhandled.push(error)
    process.on('unhandledRejection', onUnhandled)
    try {
      const xapi = makeXapi({ chains: [{ sr: 'OpaqueRef:sr1', length: 3 }], scanFails: true })
      await assert.rejects(xapi.assertHealthyVdiChains('OpaqueRef:vm', 0), { message: 'unhealthy VDI chain' })
      await new Promise(resolve => setImmediate(resolve))
      assert.deepEqual(unhandled, [])
    } finally {
      process.off('unhandledRejection', onUnhandled)
    }
  })
})
