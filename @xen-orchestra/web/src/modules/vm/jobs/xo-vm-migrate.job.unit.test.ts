import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type { VmMigratePayload } from '@/modules/vm/form/migrate/use-vm-migrate-form.ts'
import { useXoVmMigrateJob } from '@/modules/vm/jobs/xo-vm-migrate.job.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { createHost } from '@/test/create-host.ts'
import { createVm } from '@/test/create-vm.ts'
import { t } from '@/test/i18n.ts'
import { itCanRun, itCannotRun, itRejectsWithRequestError } from '@/test/job-cases.ts'
import { xoCollectionsMock } from '@/test/mock-xo-collections.ts'
import { answerPostsWithTask, taskUtilsMock } from '@/test/mock-xo-task-utils.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { mockModule, mockedExport } from '@/test/spy-on-module.ts'
import { VM_OPERATIONS, VM_POWER_STATE } from '@vates/types'
import { flushPromises } from '@vue/test-utils'
import { ref } from 'vue'

const fetchPostMock = mockedExport(fetchPost)

const { monitorTask: monitorTaskMock } = taskUtilsMock

// The task collection would open an SSE subscription
mockModule(import('@/shared/composables/xo-task-utils.composable.ts'), () => import('@/test/mock-xo-task-utils.ts'))

const POOL_ID = 'pool-source' as FrontXoPool['id']
const OTHER_POOL_ID = 'pool-other' as FrontXoPool['id']
const HOST_ID = 'host-target' as FrontXoHost['id']
const OTHER_POOL_HOST_ID = 'host-other-pool' as FrontXoHost['id']

const hosts = [
  createHost({ id: HOST_ID, $pool: POOL_ID }),
  createHost({ id: OTHER_POOL_HOST_ID, $pool: OTHER_POOL_ID }),
]

mockModule(
  import('@/modules/host/remote-resources/use-xo-host-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)

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
  taskUtilsMock.reset()
  xoCollectionsMock.reset()
  xoCollectionsMock.hosts.value = hosts

  answerPostsWithTask(fetchPostMock)
})

describe('validate', () => {
  itCanRun([
    {
      name: 'can run for a running VM',
      mountJob: () => mountMigrateJob(createVm({ power_state: VM_POWER_STATE.RUNNING })),
    },
    {
      name: 'can run for a halted VM before the drawer has produced a payload',
      mountJob: () => mountMigrateJob(createVm({ power_state: VM_POWER_STATE.HALTED }), { payload: undefined }),
    },
    {
      name: 'can run for a halted VM migrated to another pool',
      mountJob: () =>
        mountMigrateJob(createVm({ power_state: VM_POWER_STATE.HALTED, $pool: POOL_ID }), {
          payload: crossPoolPayload,
        }),
    },
    {
      name: 'can run for a halted VM migrated within its pool when a disk changes SR',
      mountJob: () =>
        mountMigrateJob(createVm({ power_state: VM_POWER_STATE.HALTED, $pool: POOL_ID }), {
          payload: payloadWithMovedDisk,
        }),
    },
    {
      name: 'can run for a halted VM migrated within its pool without any disk changing SR',
      mountJob: () => mountMigrateJob(createVm({ power_state: VM_POWER_STATE.HALTED, $pool: POOL_ID })),
    },
    {
      name: 'can run for a suspended VM migrated to another pool',
      mountJob: () =>
        mountMigrateJob(createVm({ power_state: VM_POWER_STATE.SUSPENDED, $pool: POOL_ID }), {
          payload: crossPoolPayload,
        }),
    },
    {
      name: 'can run for a suspended VM migrated within its pool when a disk changes SR',
      mountJob: () =>
        mountMigrateJob(createVm({ power_state: VM_POWER_STATE.SUSPENDED, $pool: POOL_ID }), {
          payload: payloadWithMovedDisk,
        }),
    },
    {
      name: 'can run for a suspended VM migrated within its pool without any disk changing SR',
      mountJob: () => mountMigrateJob(createVm({ power_state: VM_POWER_STATE.SUSPENDED, $pool: POOL_ID })),
    },
    {
      name: 'can run for a running VM migrated within its pool without any disk changing SR',
      mountJob: () => mountMigrateJob(createVm({ power_state: VM_POWER_STATE.RUNNING, $pool: POOL_ID })),
    },
    {
      name: 'can run before the drawer has produced a payload',
      mountJob: () => mountMigrateJob(createVm(), { payload: undefined }),
    },
  ])

  itCannotRun([
    {
      name: 'cannot run for a paused VM',
      mountJob: () => mountMigrateJob(createVm({ power_state: VM_POWER_STATE.PAUSED })),
      errorMessage: t('job:vm-migrate:paused'),
    },
    {
      name: 'cannot run when migrate_send is blocked on the VM',
      mountJob: () =>
        mountMigrateJob(createVm({ blockedOperations: { migrate_send: 'true' } as FrontXoVm['blockedOperations'] })),
      errorMessage: t('job:vm-migrate:blocked-operation'),
    },
    {
      name: 'cannot run when pool_migrate is blocked on the VM',
      mountJob: () =>
        mountMigrateJob(createVm({ blockedOperations: { pool_migrate: 'true' } as FrontXoVm['blockedOperations'] })),
      errorMessage: t('job:vm-migrate:blocked-operation'),
    },
    {
      name: 'cannot run when the destination host is not in the collection',
      mountJob: () =>
        mountMigrateJob(createVm({ power_state: VM_POWER_STATE.HALTED, $pool: POOL_ID }), {
          payload: unknownHostPayload,
        }),
      errorMessage: t('job:vm-migrate:missing-host'),
    },
  ])

  it('reports a migration in progress while the VM is being migrated', () => {
    const job = mountMigrateJob(createVm({ current_operations: { 'op-1': VM_OPERATIONS.MIGRATE_SEND } }))

    expect(job.canRun).toBe(false)
    expect(job.isRunning).toBe(true)
    expect(job.errorMessage).toBe(t('job:vm-migrate:in-progress'))
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
    expect(monitorTaskMock).toHaveBeenCalledWith(`task-of-vms/${vm.id}/actions/migrate`)
  })

  itRejectsWithRequestError('rejects when the task fails', {
    request: monitorTaskMock,
    errorMessage: 'VM_INCOMPATIBLE_WITH_THIS_HOST()',
    run: () => mountMigrateJob(createVm()).run(),
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
