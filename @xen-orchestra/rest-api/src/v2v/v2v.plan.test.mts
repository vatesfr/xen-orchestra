import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { VmwareVm, XoV2vStartPayload, XoV2vStartPayloadVm } from '@vates/types'

import { planMigration } from './v2v.plan.mjs'
import type { V2vStartBody, V2vStartVm } from './v2v.type.mjs'

// The front builds its request as `XoV2vStartPayload`, which cannot be the body of the route itself: its ids are
// branded, which tsoa would validate as objects. Checked here at build time instead: the payload must be accepted,
// and must not carry a key the route refuses (`throw-on-extras`)
const frontPayload = {} as XoV2vStartPayload
export const acceptedFrontPayload: V2vStartBody = frontPayload
type ExtraKeys =
  | Exclude<keyof XoV2vStartPayload, keyof V2vStartBody>
  | Exclude<keyof XoV2vStartPayloadVm, keyof V2vStartVm>
export const noExtraKeyInFrontPayload: [ExtraKeys] extends [never] ? true : false = true

const sourceVm = (id: string, { disks = ['scsi0:0'], nics = ['4000'] } = {}): VmwareVm => ({
  id,
  name: `name of ${id}`,
  secureBoot: false,
  isTemplate: false,
  datastores: [],
  networks: [],
  snapshots: [],
  disks: disks.map(key => ({ key, label: key, capacity: 1, thinProvisioned: false, rdm: false, encrypted: false })),
  nics: nics.map(key => ({ key, label: key })),
})

const makeContext = ({ vms = [sourceVm('vm-1')] }: { vms?: VmwareVm[] } = {}) => new Map(vms.map(vm => [vm.id, vm]))

const makeBody = (body: Partial<V2vStartBody> = {}): V2vStartBody => ({
  connection: { host: 'vcenter', username: 'user', password: 'password' },
  defaults: { sr: 'sr-1', network: 'net-1', template: 'tpl-1' },
  vms: [{ id: 'vm-1' }],
  ...body,
})

const messagesOf = ({ problems }: ReturnType<typeof planMigration>) => problems.map(({ message }) => message)

describe('planMigration', function () {
  it('applies the defaults', function () {
    const result = planMigration(makeBody(), makeContext())

    assert.deepEqual(result.problems, [])
    assert.deepEqual(result.plans, [
      {
        id: 'vm-1',
        name: 'name of vm-1',
        sr: 'sr-1',
        network: 'net-1',
        disks: {},
        nics: {},
        template: 'tpl-1',
        stopSource: false,
      },
    ])
  })

  it('applies the options of a VM over the defaults', function () {
    const result = planMigration(
      makeBody({
        defaults: { sr: 'sr-1', network: 'net-1', template: 'tpl-1', stopSource: true },
        vms: [
          { id: 'vm-1', disks: { 'scsi0:0': 'sr-2' }, nics: { '4000': 'net-2' }, template: 'tpl-2', stopSource: false },
        ],
      }),
      makeContext()
    )

    assert.deepEqual(result.problems, [])
    assert.deepEqual(result.plans[0], {
      id: 'vm-1',
      name: 'name of vm-1',
      sr: 'sr-1',
      network: 'net-1',
      disks: { 'scsi0:0': 'sr-2' },
      nics: { '4000': 'net-2' },
      template: 'tpl-2',
      stopSource: false,
    })
  })

  it('refuses the options the import does not support yet', function () {
    const result = planMigration(
      makeBody({ vms: [{ id: 'vm-1', startVm: true, cleanup: true, tags: ['migrated-from:vmware'], keepMac: false }] }),
      makeContext()
    )

    assert.deepEqual(
      result.problems.map(({ field }) => field),
      ['startVm', 'cleanup', 'tags', 'keepMac']
    )
  })

  it('accepts the unsupported options when they ask for nothing', function () {
    const result = planMigration(
      makeBody({ vms: [{ id: 'vm-1', startVm: false, cleanup: false, tags: [], keepMac: true }] }),
      makeContext()
    )

    assert.deepEqual(result.problems, [])
  })

  it('refuses unknown VMs and a VM listed twice', function () {
    const result = planMigration(
      makeBody({ vms: [{ id: 'vm-1' }, { id: 'vm-1' }, { id: 'vm-unknown' }] }),
      makeContext()
    )

    assert.deepEqual(messagesOf(result), ['the VM is listed more than once', 'no such VM on the source'])
  })

  it('refuses disks which cannot be read', function () {
    const vm = sourceVm('vm-1')
    vm.disks[0].rdm = true
    const result = planMigration(makeBody(), makeContext({ vms: [vm] }))

    assert.deepEqual(messagesOf(result), ['the disk scsi0:0 is a raw device mapping, which cannot be imported'])
  })

  it('reports the problems of every VM, and plans only the valid ones', function () {
    const vms = [sourceVm('vm-1'), sourceVm('vm-2')]
    const result = planMigration(
      makeBody({ vms: [{ id: 'vm-1', startVm: true }, { id: 'vm-2' }] }),
      makeContext({ vms })
    )

    assert.equal(result.problems.length, 1)
    assert.deepEqual(
      result.plans.map(({ id }) => id),
      ['vm-2']
    )
  })
})
