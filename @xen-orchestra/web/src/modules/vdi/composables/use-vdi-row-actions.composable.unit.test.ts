import type { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { useXoPbdCollection } from '@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'
import type { useXoSrCollection } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { useXoTaskCollection } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import { useXoVbdConnectJob } from '@/modules/vbd/jobs/xo-vbd-connect.job.ts'
import { useXoVbdDeleteJob } from '@/modules/vbd/jobs/xo-vbd-delete.job.ts'
import { useXoVbdDisconnectJob } from '@/modules/vbd/jobs/xo-vbd-disconnect.job.ts'
import type { FrontXoVbd, useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import { useVdiRowActions } from '@/modules/vdi/composables/use-vdi-row-actions.composable.ts'
import { useXoVdiDeleteJob } from '@/modules/vdi/jobs/xo-vdi-delete.job.ts'
import { useXoVdiMigrateJob } from '@/modules/vdi/jobs/xo-vdi-migrate.job.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createVbd } from '@/test/create-vbd.ts'
import { createVdi } from '@/test/create-vdi.ts'
import { createVm } from '@/test/create-vm.ts'
import { t } from '@/test/i18n.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import type { ActionItem } from '@core/tables/column-definitions/action-column.ts'
import { VM_POWER_STATE } from '@vates/types'
import { computed, ref } from 'vue'

const { useGetVbdsByIds } = vi.hoisted(() => ({
  useGetVbdsByIds: vi.fn(),
}))

vi.mock(import('@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'), () => ({
  useXoVbdCollection: (() => ({ useGetVbdsByIds })) as unknown as typeof useXoVbdCollection,
}))

// Only reached through the migration form and the task monitoring, which no test opens
vi.mock(import('@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'), () => ({
  useXoSrCollection: (() => ({
    srs: computed(() => []),
    useGetSrById: () => computed(() => undefined),
  })) as unknown as typeof useXoSrCollection,
}))

vi.mock(import('@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'), () => ({
  useXoPbdCollection: (() => ({
    pbdsBySr: computed(() => new Map()),
    getPbdsByIds: () => [],
  })) as unknown as typeof useXoPbdCollection,
}))

vi.mock(import('@/modules/host/remote-resources/use-xo-host-collection.ts'), () => ({
  useXoHostCollection: (() => ({ getHostById: () => undefined })) as unknown as typeof useXoHostCollection,
}))

vi.mock(import('@/modules/task/remote-resources/use-xo-task-collection.ts'), () => ({
  useXoTaskCollection: (() => ({
    useGetTaskById: () => computed(() => undefined),
  })) as unknown as typeof useXoTaskCollection,
}))

beforeEach(() => {
  useGetVbdsByIds.mockReset()
  useGetVbdsByIds.mockReturnValue(computed(() => []))
})

const vdi = createVdi()

const vm = createVm()

function mockVbds(...vbds: FrontXoVbd[]) {
  useGetVbdsByIds.mockReturnValue(computed(() => vbds))
}

function mountRowActions(rowVm: FrontXoVm | undefined, ...vbds: FrontXoVbd[]) {
  mockVbds(...vbds)

  return mountComposable(() => useVdiRowActions(vdi, rowVm)).wrapper
}

/**
 * Starts the given jobs on the same VDI, VBD and VM as the row — the way the side-panel buttons do. `fetch`
 * never settles in unit tests, so every job stays in progress until the test ends.
 */
function mountWhileRunning(vbd: FrontXoVbd, startJobs: (vbd: FrontXoVbd) => { run: () => Promise<unknown> }[]) {
  mockVbds(vbd)

  const { wrapper } = mountComposable(() => ({ ...useVdiRowActions(vdi, vm), jobs: startJobs(vbd) }))

  wrapper.vm.jobs.forEach(job => job.run())

  return wrapper
}

function findAction(actions: ActionItem[], label: string) {
  return actions.find(action => action.label === label)
}

const startMigration = () => useXoVdiMigrateJob(() => [vdi], 'sr-2')

const startDeletion = () => useXoVdiDeleteJob(() => [vdi], vm)

// One row per job the row tracks, with a VBD state that lets that job start
const runningJobs = [
  {
    action: 'migrate',
    label: 'action:migrate-vdi-on-sr',
    message: 'job:vdi-migrate:in-progress',
    attached: false,
    start: () => [startMigration()],
  },
  {
    action: 'delete',
    label: 'action:delete',
    message: 'job:delete:in-progress',
    attached: false,
    start: () => [startDeletion()],
  },
  {
    action: 'detach',
    label: 'action:detach-vdi',
    message: 'job:vdi-detach:in-progress',
    attached: false,
    start: (vbd: FrontXoVbd) => [useXoVbdDeleteJob([vbd], vm)],
  },
  {
    action: 'connect',
    label: 'action:connect',
    message: 'job:connect:in-progress',
    attached: false,
    start: (vbd: FrontXoVbd) => [useXoVbdConnectJob([vbd], vm)],
  },
  {
    action: 'disconnect',
    label: 'action:disconnect',
    message: 'job:disconnect:in-progress',
    attached: true,
    start: (vbd: FrontXoVbd) => [useXoVbdDisconnectJob([vbd], vm)],
  },
]

describe('actions', () => {
  it('offers to connect, migrate, import/export, detach and delete a VDI shown for a VM', () => {
    const wrapper = mountRowActions(vm, createVbd({ attached: false }))

    expect(wrapper.vm.actions.map(action => action.label)).toEqual([
      t('action:connect'),
      t('action:migrate-vdi-on-sr'),
      t('action:import-export'),
      t('action:detach-vdi'),
      t('action:delete'),
    ])
  })

  it('leaves out the connection and detach actions when no VM is given', () => {
    const wrapper = mountRowActions(undefined, createVbd({ attached: false }))

    expect(wrapper.vm.actions.map(action => action.label)).toEqual([
      t('action:migrate-vdi-on-sr'),
      t('action:import-export'),
      t('action:delete'),
    ])
  })

  it('follows the VM it is given', () => {
    mockVbds(createVbd({ attached: false }))

    const rowVm = ref<FrontXoVm>()
    const { wrapper } = mountComposable(() => useVdiRowActions(vdi, rowVm))

    expect(findAction(wrapper.vm.actions, t('action:connect'))).toBeUndefined()

    rowVm.value = vm

    expect(findAction(wrapper.vm.actions, t('action:connect'))).toBeDefined()
  })

  it('offers to disconnect instead when the VBD of the VM is attached', () => {
    const wrapper = mountRowActions(vm, createVbd({ attached: true }))

    expect(wrapper.vm.actions[0]).toMatchObject({ label: t('action:disconnect'), icon: 'action:disconnect' })
  })

  it('ignores the VBDs plugging the VDI into another VM', () => {
    const wrapper = mountRowActions(vm, createVbd({ VM: 'vm-other' as FrontXoVbd['VM'], attached: true }))

    expect(wrapper.vm.actions[0]).toMatchObject({
      label: t('action:connect'),
      disabled: true,
      hint: t('job:vbd-connect:missing-vbd'),
    })
  })

  it('enables connecting the VDI to a running VM', () => {
    const wrapper = mountRowActions(vm, createVbd({ attached: false }))

    expect(findAction(wrapper.vm.actions, t('action:connect'))).toMatchObject({
      icon: 'action:connect',
      disabled: false,
      hint: undefined,
    })
  })

  it('disables connecting and says why when the VM is halted', () => {
    const wrapper = mountRowActions(createVm({ power_state: VM_POWER_STATE.HALTED }), createVbd({ attached: false }))

    expect(findAction(wrapper.vm.actions, t('action:connect'))).toMatchObject({
      disabled: true,
      hint: t('job:vm-not-running'),
    })
  })

  it('enables disconnecting the VDI from a running VM', () => {
    const wrapper = mountRowActions(vm, createVbd({ attached: true }))

    expect(findAction(wrapper.vm.actions, t('action:disconnect'))).toMatchObject({ disabled: false, hint: undefined })
  })

  it('disables disconnecting and says why when the VM is halted', () => {
    const wrapper = mountRowActions(createVm({ power_state: VM_POWER_STATE.HALTED }), createVbd({ attached: true }))

    expect(findAction(wrapper.vm.actions, t('action:disconnect'))).toMatchObject({
      disabled: true,
      hint: t('job:vm-not-running'),
    })
  })

  it('disables detaching and deleting, and says why, while the VDI is attached to the VM', () => {
    const wrapper = mountRowActions(vm, createVbd({ attached: true }))

    expect(findAction(wrapper.vm.actions, t('action:detach-vdi'))).toMatchObject({
      disabled: true,
      hint: t('vm-running'),
    })
    expect(findAction(wrapper.vm.actions, t('action:delete'))).toMatchObject({
      disabled: true,
      hint: t('vm-running'),
    })
  })

  it('enables detaching and deleting once the VDI is disconnected from the VM', () => {
    const wrapper = mountRowActions(vm, createVbd({ attached: false }))

    expect(findAction(wrapper.vm.actions, t('action:detach-vdi'))).toMatchObject({ disabled: false, hint: undefined })
    expect(findAction(wrapper.vm.actions, t('action:delete'))).toMatchObject({
      disabled: false,
      hint: undefined,
      accent: 'danger',
    })
  })

  it('enables the migration while none is in progress', () => {
    const wrapper = mountRowActions(vm, createVbd({ attached: false }))

    expect(findAction(wrapper.vm.actions, t('action:migrate-vdi-on-sr'))).toMatchObject({
      disabled: false,
      hint: undefined,
    })
  })

  it('disables the migration and says why while one is in progress', () => {
    const wrapper = mountWhileRunning(createVbd({ attached: false }), () => [startMigration()])

    expect(findAction(wrapper.vm.actions, t('action:migrate-vdi-on-sr'))).toMatchObject({
      disabled: true,
      hint: t('job:migrate:in-progress'),
    })
  })

  it('nests the content export under import/export', () => {
    const wrapper = mountRowActions(vm, createVbd({ attached: false }))

    expect(findAction(wrapper.vm.actions, t('action:import-export'))?.children).toMatchObject([
      { label: t('action:export-content'), icon: 'action:download' },
    ])
  })

  it.each(runningJobs)('marks the $action action as busy while it runs', ({ attached, start, label }) => {
    const wrapper = mountWhileRunning(createVbd({ attached }), start)

    expect(findAction(wrapper.vm.actions, t(label))?.busy).toBe(true)
  })
})

describe('runningAction', () => {
  it('is "none" while no job runs', () => {
    const wrapper = mountRowActions(vm, createVbd({ attached: false }))

    expect(wrapper.vm.runningAction).toBe('none')
  })

  it.each(runningJobs)('is "$action" while that job runs', ({ attached, start, action }) => {
    const wrapper = mountWhileRunning(createVbd({ attached }), start)

    expect(wrapper.vm.runningAction).toBe(action)
  })

  it('reports the migration first while the VDI is also being deleted', () => {
    const wrapper = mountWhileRunning(createVbd({ attached: false }), () => [startDeletion(), startMigration()])

    expect(wrapper.vm.runningAction).toBe('migrate')
  })
})

describe('busyMessage', () => {
  it('is undefined while no job runs', () => {
    const wrapper = mountRowActions(vm, createVbd({ attached: false }))

    expect(wrapper.vm.busyMessage).toBeUndefined()
  })

  it.each(runningJobs)('says the $action is in progress while it runs', ({ attached, start, message }) => {
    const wrapper = mountWhileRunning(createVbd({ attached }), start)

    expect(wrapper.vm.busyMessage).toBe(t(message))
  })
})
