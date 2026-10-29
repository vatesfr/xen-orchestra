import { buildV2vStartPayload, getV2vStartProblems } from '@/modules/v2v/utils/v2v-start-payload.util.ts'
import { createApiError } from '@/test/create-api-error.ts'
import { createV2vConnection } from '@/test/create-v2v-connection.ts'
import { createV2vLaunchSettings, createV2vStartVm } from '@/test/create-v2v-launch.ts'
import { createV2vDestinationDefaults } from '@/test/create-v2v-migration-list.ts'
import { getV2vVmIds } from '@/test/create-v2v-vm-row.ts'
import type { XoNetwork, XoSr, XoV2vVm, XoVmTemplate } from '@vates/types'

const OVERRIDES = {
  disks: { 'disk-1': 'sr-456' as XoSr['id'] },
  nics: { 'nic-1': 'network-456' as XoNetwork['id'] },
  template: 'template-456' as XoVmTemplate['id'],
}

function buildPayload(input: Partial<Parameters<typeof buildV2vStartPayload>[0]> = {}) {
  return buildV2vStartPayload({
    connection: createV2vConnection(),
    defaults: createV2vDestinationDefaults(),
    settings: createV2vLaunchSettings(),
    vms: [createV2vStartVm()],
    ...input,
  })
}

// The body of the 422 the REST API answers a refused launch with
function createRefusedLaunchError(errors: unknown) {
  return createApiError(422, { error: 'the migration cannot be started', data: { errors } })
}

describe('buildV2vStartPayload', () => {
  it('sends the connection, the launch settings and the list defaults, never starting nor cleaning up the VMs', () => {
    const payload = buildPayload({
      settings: createV2vLaunchSettings({ stopSource: false, stopOnError: false, concurrency: 4 }),
    })

    expect(payload).toMatchObject({
      connection: createV2vConnection(),
      defaults: { ...createV2vDestinationDefaults(), stopSource: false, startVm: false, cleanup: false },
      stopOnError: false,
      concurrency: 4,
    })
  })

  it('sends a new VM with its mapping overrides only', () => {
    expect(buildPayload({ vms: [createV2vStartVm(OVERRIDES)] }).vms).toEqual([
      { id: 'vm-1', ...OVERRIDES, tags: [], keepMac: true },
    ])
  })

  it('sends a new VM on the list defaults without mapping', () => {
    expect(buildPayload().vms).toEqual([{ id: 'vm-1', tags: [], keepMac: true }])
  })

  it('sends a resumed VM without mapping, the import reads it from its first sync', () => {
    expect(buildPayload({ vms: [createV2vStartVm({ kind: 'resume', ...OVERRIDES })] }).vms).toEqual([
      { id: 'vm-1', tags: [], keepMac: true },
    ])
  })

  it.each([true, false])('sends the stop source override (%s) of a VM', stopSource => {
    expect(buildPayload({ vms: [createV2vStartVm({ overrides: { stopSource } })] }).vms).toEqual([
      { id: 'vm-1', stopSource, tags: [], keepMac: true },
    ])
  })

  it('sends the VMs given, in order', () => {
    const vms = ['vm-2', 'vm-1'].map(id => createV2vStartVm({ id: id as XoV2vVm['id'] }))

    expect(getV2vVmIds(buildPayload({ vms }).vms)).toEqual(['vm-2', 'vm-1'])
  })
})

describe('getV2vStartProblems', () => {
  it('reads every problem of a refused launch, of a VM or of the whole launch', () => {
    const error = createRefusedLaunchError([
      { vm: 'vm-1', field: 'tags', message: 'tags are not supported yet' },
      { field: 'defaults.startVm', message: 'starting the VM after its import is not supported yet' },
    ])

    expect(getV2vStartProblems(error)).toEqual([
      { vmId: 'vm-1', message: 'tags are not supported yet' },
      { message: 'starting the VM after its import is not supported yet' },
    ])
  })

  it('ignores the problems it cannot read', () => {
    const error = createRefusedLaunchError([
      { vm: 'vm-1' },
      { vm: 'vm-1', message: 42 },
      { vm: 42, message: 'no such VM on the source' },
      null,
    ])

    expect(getV2vStartProblems(error)).toEqual([{ message: 'no such VM on the source' }])
  })

  it.each([
    ['a 422 without problem list', createApiError(422, { error: 'invalid' })],
    ['a 422 whose problems are not a list', createRefusedLaunchError('invalid')],
    ['a 422 without readable problem', createRefusedLaunchError([{ vm: 'vm-1' }])],
  ])('reads no problem from %s', (_, error) => {
    expect(getV2vStartProblems(error)).toBeUndefined()
  })
})
