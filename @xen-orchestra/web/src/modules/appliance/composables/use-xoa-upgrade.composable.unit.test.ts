import { useXoaUpgrade } from '@/modules/appliance/composables/use-xoa-upgrade.composable.ts'
import { useXoaSnapshotJob } from '@/modules/appliance/jobs/xoa-snapshot.job.ts'
import { useXoaUpgradeJob } from '@/modules/appliance/jobs/xoa-upgrade.job.ts'
import { type FrontXoTask, useXoTaskCollection } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import { createJobStub } from '@/test/create-job-result.ts'
import { createTask } from '@/test/create-task.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { mockedExport } from '@/test/spy-on-module.ts'
import { ref } from 'vue'

const UPGRADE_TASK_NAME = 'REST API: upgrade XO appliance'

const snapshotJob = createJobStub(useXoaSnapshotJob)

const upgradeJob = createJobStub(useXoaUpgradeJob)

const taskCollection = mockedExport(useXoTaskCollection)

const sortedTasks = ref<FrontXoTask[]>([])

beforeEach(() => {
  snapshotJob.reset()
  upgradeJob.reset()

  sortedTasks.value = []
  taskCollection.mockReturnValue({ sortedTasks })
})

function mountXoaUpgrade() {
  return mountComposable(() => useXoaUpgrade()).wrapper.vm
}

function createUpgradeTask(overrides: Partial<FrontXoTask> = {}) {
  return createTask({ start: 1_000, properties: { name: UPGRADE_TASK_NAME }, ...overrides })
}

describe('upgrade', () => {
  it('is undefined when nothing is being installed', () => {
    expect(mountXoaUpgrade().upgrade).toBeUndefined()
  })

  it('is in the snapshot phase while the snapshot is running', () => {
    snapshotJob.setState({ isRunning: true })

    expect(mountXoaUpgrade().upgrade).toEqual({ phase: 'snapshot' })
  })

  it('is in the upgrade phase, without start, while the upgrade request is running', () => {
    upgradeJob.setState({ isRunning: true })

    expect(mountXoaUpgrade().upgrade).toEqual({ phase: 'upgrade' })
  })

  it('is in the upgrade phase from the start of the pending upgrade task', () => {
    sortedTasks.value = [createTask({ id: 'other' as FrontXoTask['id'] }), createUpgradeTask()]

    expect(mountXoaUpgrade().upgrade).toEqual({ phase: 'upgrade', start: 1_000 })
  })

  it('follows the upgrade task over the running jobs', () => {
    snapshotJob.setState({ isRunning: true })
    sortedTasks.value = [createUpgradeTask()]

    expect(mountXoaUpgrade().upgrade).toEqual({ phase: 'upgrade', start: 1_000 })
  })

  it('ignores an upgrade task which is no longer pending', () => {
    sortedTasks.value = [createUpgradeTask({ status: 'success' })]

    expect(mountXoaUpgrade().upgrade).toBeUndefined()
  })

  it('ignores a pending task of another action', () => {
    sortedTasks.value = [createTask({ properties: { name: 'REST API: snapshot VM' } })]

    expect(mountXoaUpgrade().upgrade).toBeUndefined()
  })
})
