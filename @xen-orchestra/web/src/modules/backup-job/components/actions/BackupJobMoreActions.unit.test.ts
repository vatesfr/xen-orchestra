import BackupJobMoreActions from '@/modules/backup-job/components/actions/BackupJobMoreActions.vue'
import { useXoBackupJobChangeStateJob } from '@/modules/backup-job/jobs/xo-backup-job-change-state.job.ts'
import { useXoBackupJobDuplicateJob } from '@/modules/backup-job/jobs/xo-backup-job-duplicate.job.ts'
import { useXoBackupJobRunJob } from '@/modules/backup-job/jobs/xo-backup-job-run.job.ts'
import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import { createVmBackupJob } from '@/test/create-backup-job.ts'
import { createJobStub } from '@/test/create-job-result.ts'
import { createSchedule } from '@/test/create-schedule.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { scheduleCollectionMock } from '@/test/mock-xo-schedule-collection.ts'
import { mockModule } from '@/test/spy-on-module.ts'
import type { ActionItem } from '@core/components/menu/VtsActionsMenu.vue'
import VtsActionItems from '@core/components/menu/VtsActionItems.vue'
import { mount } from '@vue/test-utils'
import { toValue } from 'vue'

const changeStateJob = createJobStub(useXoBackupJobChangeStateJob)
const runJob = createJobStub(useXoBackupJobRunJob)
const duplicateJob = createJobStub(useXoBackupJobDuplicateJob)

mockModule(
  import('@/modules/schedule/remote-resources/use-xo-schedule-collection.ts'),
  () => import('@/test/mock-xo-schedule-collection.ts')
)

const backupJob = createVmBackupJob()

beforeEach(() => {
  changeStateJob.reset()
  runJob.reset()
  duplicateJob.reset()
  scheduleCollectionMock.reset()
})

function mountMoreActions(job: FrontAnyXoBackupJob = backupJob) {
  return mount(BackupJobMoreActions, {
    props: { backupJob: job },
    global: createGlobalTestConfig(),
  })
}

function findActions(wrapper: ReturnType<typeof mountMoreActions>) {
  return wrapper.getComponent(VtsActionItems).props('actions') as ActionItem[]
}

it('offers to change the state, then to run and duplicate the backup job', () => {
  scheduleCollectionMock.schedules.value = [createSchedule({ jobId: backupJob.id, enabled: true })]

  expect(findActions(mountMoreActions()).map(action => action.label)).toEqual([
    t('action:disable'),
    t('action:manual-run'),
    t('action:duplicate'),
  ])
})

it('offers to disable an enabled backup job', () => {
  scheduleCollectionMock.schedules.value = [createSchedule({ jobId: backupJob.id, enabled: true })]

  const [changeStateAction] = findActions(mountMoreActions())

  expect(changeStateAction).toMatchObject({ label: t('action:disable'), icon: 'action:disable' })
  expect(toValue(changeStateJob.use.mock.calls[0]?.[1])).toBe(false)
})

it('offers to enable a disabled backup job', () => {
  scheduleCollectionMock.schedules.value = [createSchedule({ jobId: backupJob.id, enabled: false })]

  const [changeStateAction] = findActions(mountMoreActions())

  expect(changeStateAction).toMatchObject({ label: t('action:enable'), icon: 'status:success-circle' })
  expect(toValue(changeStateJob.use.mock.calls[0]?.[1])).toBe(true)
})

it('runs each action on click', () => {
  for (const action of findActions(mountMoreActions())) {
    action.onClick?.()
  }

  expect(changeStateJob.run).toHaveBeenCalledOnce()
  expect(runJob.run).toHaveBeenCalledOnce()
  expect(duplicateJob.run).toHaveBeenCalledOnce()
})
