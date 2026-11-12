import BackupJobMoreActions from '@/modules/backup-job/components/actions/BackupJobMoreActions.vue'
import type { useXoBackupJobChangeStateJob } from '@/modules/backup-job/jobs/xo-backup-job-change-state.job.ts'
import type { useXoBackupJobDuplicateJob } from '@/modules/backup-job/jobs/xo-backup-job-duplicate.job.ts'
import type { useXoBackupJobRunJob } from '@/modules/backup-job/jobs/xo-backup-job-run.job.ts'
import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import type {
  FrontXoSchedule,
  useXoScheduleCollection,
} from '@/modules/schedule/remote-resources/use-xo-schedule-collection.ts'
import { createVmBackupJob } from '@/test/create-backup-job.ts'
import { createSchedule } from '@/test/create-schedule.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import type { ActionItem } from '@core/components/menu/VtsActionsMenu.vue'
import VtsActionItems from '@core/components/menu/VtsActionItems.vue'
import { mount } from '@vue/test-utils'
import { ref, toValue } from 'vue'

const { changeState, runBackupJobs, duplicate, changeStateArgs, schedulesByJobId } = vi.hoisted(() => ({
  changeState: vi.fn(),
  runBackupJobs: vi.fn(),
  duplicate: vi.fn(),
  changeStateArgs: [] as unknown[][],
  schedulesByJobId: new Map<string, FrontXoSchedule[]>(),
}))

function toJobState(run: unknown) {
  return { run, canRun: ref(true), isRunning: ref(false), errorMessage: ref(undefined) }
}

vi.mock(import('@/modules/schedule/remote-resources/use-xo-schedule-collection.ts'), () => ({
  useXoScheduleCollection: (() => ({
    schedulesByJobId: ref(schedulesByJobId),
  })) as unknown as typeof useXoScheduleCollection,
}))

vi.mock(import('@/modules/backup-job/jobs/xo-backup-job-change-state.job.ts'), () => ({
  useXoBackupJobChangeStateJob: ((...args: unknown[]) => {
    changeStateArgs.push(args)

    return toJobState(changeState)
  }) as unknown as typeof useXoBackupJobChangeStateJob,
}))

vi.mock(import('@/modules/backup-job/jobs/xo-backup-job-run.job.ts'), () => ({
  useXoBackupJobRunJob: (() => toJobState(runBackupJobs)) as unknown as typeof useXoBackupJobRunJob,
}))

vi.mock(import('@/modules/backup-job/jobs/xo-backup-job-duplicate.job.ts'), () => ({
  useXoBackupJobDuplicateJob: (() => toJobState(duplicate)) as unknown as typeof useXoBackupJobDuplicateJob,
}))

const backupJob = createVmBackupJob()

beforeEach(() => {
  changeState.mockReset()
  runBackupJobs.mockReset()
  duplicate.mockReset()
  changeStateArgs.length = 0
  schedulesByJobId.clear()
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
  schedulesByJobId.set(backupJob.id, [createSchedule({ jobId: backupJob.id, enabled: true })])

  expect(findActions(mountMoreActions()).map(action => action.label)).toEqual([
    t('action:disable'),
    t('action:manual-run'),
    t('action:duplicate'),
  ])
})

it('offers to disable an enabled backup job', () => {
  schedulesByJobId.set(backupJob.id, [createSchedule({ jobId: backupJob.id, enabled: true })])

  const [changeStateAction] = findActions(mountMoreActions())

  expect(changeStateAction).toMatchObject({ label: t('action:disable'), icon: 'action:disable' })
  expect(toValue(changeStateArgs[0]?.[1])).toBe(false)
})

it('offers to enable a disabled backup job', () => {
  schedulesByJobId.set(backupJob.id, [createSchedule({ jobId: backupJob.id, enabled: false })])

  const [changeStateAction] = findActions(mountMoreActions())

  expect(changeStateAction).toMatchObject({ label: t('action:enable'), icon: 'status:success-circle' })
  expect(toValue(changeStateArgs[0]?.[1])).toBe(true)
})

it('runs each action on click', () => {
  for (const action of findActions(mountMoreActions())) {
    action.onClick?.()
  }

  expect(changeState).toHaveBeenCalledOnce()
  expect(runBackupJobs).toHaveBeenCalledOnce()
  expect(duplicate).toHaveBeenCalledOnce()
})
