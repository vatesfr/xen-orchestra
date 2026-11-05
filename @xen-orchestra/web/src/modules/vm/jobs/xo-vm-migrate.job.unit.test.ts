import type { FrontXoHost, useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type { VmMigratePayload } from '@/modules/vm/form/migrate/use-vm-migrate-form.ts'
import { useXoVmMigrateJob } from '@/modules/vm/jobs/xo-vm-migrate.job.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { useXoTaskUtils } from '@/shared/composables/xo-task-utils.composable.ts'
import type { fetchPost } from '@/shared/utils/fetch.util.ts'
import { createHost } from '@/test/create-host.ts'
import { createVm } from '@/test/create-vm.ts'
import { t } from '@/test/i18n.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { VM_OPERATIONS, VM_POWER_STATE } from '@vates/types'
import { flushPromises } from '@vue/test-utils'
import { ref } from 'vue'

const { fetchPostMock, monitorTaskMock } = vi.hoisted(() => ({
  fetchPostMock: vi.fn(),
  monitorTaskMock: vi.fn(),
}))

vi.mock(import('@/shared/utils/fetch.util.ts'), () => ({
  fetchPost: fetchPostMock as unknown as typeof fetchPost,
}))

vi.mock(import('@/shared/composables/xo-task-utils.composable.ts'), () => ({
  useXoTaskUtils: (() => ({ monitorTask: monitorTaskMock })) as unknown as typeof useXoTaskUtils,
}))

const POOL_ID = 'pool-source' as FrontXoPool['id']
const OTHER_POOL_ID = 'pool-other' as FrontXoPool['id']
const HOST_ID = 'host-target' as FrontXoHost['id']
const OTHER_POOL_HOST_ID = 'host-other-pool' as FrontXoHost['id']
const TASK_ID = 'task-1'

const hosts = [
  createHost({ id: HOST_ID, $pool: POOL_ID }),
  createHost({ id: OTHER_POOL_HOST_ID, $pool: OTHER_POOL_ID }),
]

vi.mock(import('@/modules/host/remote-resources/use-xo-host-collection.ts'), () => ({
  useXoHostCollection: (() => ({
    getHostById: (id: FrontXoHost['id']) => hosts.find(host => host.id === id),
  })) as unknown as typeof useXoHostCollection,
}))

const payload: VmMigratePayload = { hostId: HOST_ID }

const payloadWithMovedDisk: VmMigratePayload = {
  hostId: HOST_ID,
  srIdByVdiId: { ['vdi-1' as FrontXoVdi['id']]: 'sr-1' as FrontXoSr['id'] },
}

const crossPoolPayload: VmMigratePayload = { hostId: OTHER_POOL_HOST_ID }

const unknownHostPayload: VmMigratePayload = { hostId: 'host-unknown' as FrontXoHost['id'] }

// An explicit `undefined` must reach the job, so the payload is passed through an object rather than
// a parameter with a default value, which `undefined` would trigger
function mountMigrateJob(
  vm: FrontXoVm,
  { payload: migratePayload }: { payload: VmMigratePayload | undefined } = { payload }
) {
  const { wrapper } = mountComposable(() => useXoVmMigrateJob(() => vm, ref(migratePayload)))

  return wrapper.vm
}

beforeEach(() => {
  fetchPostMock.mockReset()
  monitorTaskMock.mockReset()

  fetchPostMock.mockResolvedValue({ taskId: TASK_ID })
  monitorTaskMock.mockResolvedValue(undefined)
})

describe('validate', () => {
  it('can run for a running VM', () => {
    const job = mountMigrateJob(createVm({ power_state: VM_POWER_STATE.RUNNING }))

    expect(job.canRun).toBe(true)
    expect(job.errorMessage).toBeUndefined()
  })

  it('can run for a halted VM before the drawer has produced a payload', () => {
    const job = mountMigrateJob(createVm({ power_state: VM_POWER_STATE.HALTED }), { payload: undefined })

    expect(job.canRun).toBe(true)
    expect(job.errorMessage).toBeUndefined()
  })

  it('can run for a halted VM migrated to another pool', () => {
    const job = mountMigrateJob(createVm({ power_state: VM_POWER_STATE.HALTED, $pool: POOL_ID }), {
      payload: crossPoolPayload,
    })

    expect(job.canRun).toBe(true)
    expect(job.errorMessage).toBeUndefined()
  })

  it('can run for a halted VM migrated within its pool when a disk changes SR', () => {
    const job = mountMigrateJob(createVm({ power_state: VM_POWER_STATE.HALTED, $pool: POOL_ID }), {
      payload: payloadWithMovedDisk,
    })

    expect(job.canRun).toBe(true)
    expect(job.errorMessage).toBeUndefined()
  })

  it('can run for a halted VM migrated within its pool without any disk changing SR', () => {
    const job = mountMigrateJob(createVm({ power_state: VM_POWER_STATE.HALTED, $pool: POOL_ID }))

    expect(job.canRun).toBe(true)
    expect(job.errorMessage).toBeUndefined()
  })

  it('can run for a suspended VM migrated to another pool', () => {
    const job = mountMigrateJob(createVm({ power_state: VM_POWER_STATE.SUSPENDED, $pool: POOL_ID }), {
      payload: crossPoolPayload,
    })

    expect(job.canRun).toBe(true)
    expect(job.errorMessage).toBeUndefined()
  })

  it('can run for a suspended VM migrated within its pool when a disk changes SR', () => {
    const job = mountMigrateJob(createVm({ power_state: VM_POWER_STATE.SUSPENDED, $pool: POOL_ID }), {
      payload: payloadWithMovedDisk,
    })

    expect(job.canRun).toBe(true)
    expect(job.errorMessage).toBeUndefined()
  })

  it('can run for a suspended VM migrated within its pool without any disk changing SR', () => {
    const job = mountMigrateJob(createVm({ power_state: VM_POWER_STATE.SUSPENDED, $pool: POOL_ID }))

    expect(job.canRun).toBe(true)
    expect(job.errorMessage).toBeUndefined()
  })

  it('can run for a running VM migrated within its pool without any disk changing SR', () => {
    const job = mountMigrateJob(createVm({ power_state: VM_POWER_STATE.RUNNING, $pool: POOL_ID }))

    expect(job.canRun).toBe(true)
    expect(job.errorMessage).toBeUndefined()
  })

  it('cannot run for a paused VM', () => {
    const job = mountMigrateJob(createVm({ power_state: VM_POWER_STATE.PAUSED }))

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(t('job:vm-migrate:paused'))
  })

  it('reports a migration in progress while the VM is being migrated', () => {
    const job = mountMigrateJob(createVm({ current_operations: { 'op-1': VM_OPERATIONS.MIGRATE_SEND } }))

    expect(job.canRun).toBe(false)
    expect(job.isRunning).toBe(true)
    expect(job.errorMessage).toBe(t('job:vm-migrate:in-progress'))
  })

  it('cannot run when migrate_send is blocked on the VM', () => {
    const job = mountMigrateJob(
      createVm({ blockedOperations: { migrate_send: 'true' } as FrontXoVm['blockedOperations'] })
    )

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(t('job:vm-migrate:blocked-operation'))
  })

  it('cannot run when pool_migrate is blocked on the VM', () => {
    const job = mountMigrateJob(
      createVm({ blockedOperations: { pool_migrate: 'true' } as FrontXoVm['blockedOperations'] })
    )

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(t('job:vm-migrate:blocked-operation'))
  })

  it('can run before the drawer has produced a payload', () => {
    const job = mountMigrateJob(createVm(), { payload: undefined })

    expect(job.canRun).toBe(true)
  })

  it('cannot run when the destination host is not in the collection', () => {
    const job = mountMigrateJob(createVm({ power_state: VM_POWER_STATE.HALTED, $pool: POOL_ID }), {
      payload: unknownHostPayload,
    })

    expect(job.canRun).toBe(false)
    expect(job.errorMessage).toBe(t('job:vm-migrate:missing-host'))
  })

  // Reopening the menu mounts a new job instance whose payload is still empty: it must see the migration in progress
  it('reports a migration in progress to another instance without payload', async () => {
    monitorTaskMock.mockReturnValue(new Promise(() => {}))

    const vm = createVm()

    // Both instances are mounted together so they share the same job store
    const { wrapper } = mountComposable(() => {
      const { run } = useXoVmMigrateJob(() => vm, ref(payload))
      const { isRunning, canRun } = useXoVmMigrateJob(() => vm, ref(undefined))

      return { run, isRunning, canRun }
    })

    void wrapper.vm.run()
    await flushPromises()

    expect(wrapper.vm.isRunning).toBe(true)
    expect(wrapper.vm.canRun).toBe(false)
  })
})

describe('run', () => {
  it('posts the payload to the migrate action and waits for the task', async () => {
    const vm = createVm()
    const job = mountMigrateJob(vm)

    await job.run()

    expect(fetchPostMock).toHaveBeenCalledWith(`vms/${vm.id}/actions/migrate`, payload)
    expect(monitorTaskMock).toHaveBeenCalledWith(TASK_ID)
  })

  it('rejects when the task fails', async () => {
    const taskError = new Error('VM_INCOMPATIBLE_WITH_THIS_HOST()')
    monitorTaskMock.mockRejectedValue(taskError)

    const job = mountMigrateJob(createVm())

    await expect(job.run()).rejects.toBe(taskError)
  })

  it('rejects before posting when there is no payload', async () => {
    const job = mountMigrateJob(createVm(), { payload: undefined })

    await expect(job.run()).rejects.toThrow(t('job:vm-migrate:missing-host'))
    expect(fetchPostMock).not.toHaveBeenCalled()
  })

  it('rejects before posting when the destination host is not in the collection', async () => {
    const job = mountMigrateJob(createVm(), { payload: unknownHostPayload })

    await expect(job.run()).rejects.toThrow(t('job:vm-migrate:missing-host'))
    expect(fetchPostMock).not.toHaveBeenCalled()
  })

  it('rejects before posting when the VM cannot be migrated', async () => {
    const job = mountMigrateJob(createVm({ power_state: VM_POWER_STATE.PAUSED }))

    await expect(job.run()).rejects.toThrow(t('job:vm-migrate:paused'))
    expect(fetchPostMock).not.toHaveBeenCalled()
  })
})
