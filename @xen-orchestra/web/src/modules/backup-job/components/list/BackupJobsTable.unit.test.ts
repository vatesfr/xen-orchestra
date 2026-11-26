import BackupJobsTable from '@/modules/backup-job/components/list/BackupJobsTable.vue'
import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import type { FrontXoBackupLog } from '@/modules/backup-log/remote-resources/use-xo-backup-log-collection.ts'
import type { FrontXoSchedule } from '@/modules/schedule/remote-resources/use-xo-schedule-collection.ts'
import { createMetadataBackupJob, createMirrorBackupJob, createVmBackupJob } from '@/test/create-backup-job.ts'
import { createBackupLog } from '@/test/create-backup-log.ts'
import { createSchedule } from '@/test/create-schedule.ts'
import { createTestRouter } from '@/test/create-test-router.ts'
import { findTableColumnCells } from '@/test/find-table-cells.ts'
import { getButton } from '@/test/get-button.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { backupLogCollectionMock, mockXoBackupLogCollection } from '@/test/mock-xo-backup-log-collection.ts'
import { mockXoRoutes } from '@/test/mock-xo-routes.ts'
import { scheduleCollectionMock, mockXoScheduleCollection } from '@/test/mock-xo-schedule-collection.ts'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import { hasLoader } from '@core-test/expect-loader.ts'
import { findLink } from '@core-test/find-links.ts'
import { findStatuses } from '@core-test/find-statuses.ts'
import { pickSelectOption } from '@core-test/select.ts'
import type { XoSchedule, XoSr } from '@vates/types'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import type { Router } from 'vue-router'

mockXoRoutes()

mockXoBackupLogCollection()

mockXoScheduleCollection()

beforeEach(() => {
  backupLogCollectionMock.reset()
  scheduleCollectionMock.reset()
})

function mountTable(backupJobs: FrontAnyXoBackupJob[], router?: Router) {
  return mount(BackupJobsTable, {
    props: { backupJobs, busy: false, error: false },
    global: createGlobalTestConfig({ router }),
  })
}

function createNamedBackupJob(name: string) {
  return createVmBackupJob({ id: `backup-job-${name}` as FrontAnyXoBackupJob['id'], name })
}

function setBackupLogs(backupJob: FrontAnyXoBackupJob, statuses: FrontXoBackupLog['status'][], start = Date.now()) {
  backupLogCollectionMock.backupLogs.value.push(
    ...statuses.map(status => createBackupLog({ jobId: backupJob.id, status, start }))
  )
}

function findBackupJobNames(wrapper: VueWrapper) {
  return wrapper.findAll('tbody tr').map(row => findLink(row)?.text)
}

async function openFilter(wrapper: VueWrapper, label: string) {
  const filter = wrapper
    .findAll('.vts-filter-select')
    .find(filter => filter.get('.ui-dropdown-button').text() === label)

  if (filter === undefined) {
    throw new Error(`No filter "${label}"`)
  }

  await flushPromises()
  await filter.get('.ui-dropdown-button').trigger('click')
  await flushPromises()
}

async function pickFilterOption(wrapper: VueWrapper, filterLabel: string, optionLabel: string) {
  await openFilter(wrapper, filterLabel)
  await pickSelectOption(wrapper, optionLabel)
}

function findCell(wrapper: VueWrapper, headerLabel: string) {
  return findTableColumnCells(wrapper, headerLabel)[0]
}

function findJobCellStatuses(backupJob: FrontAnyXoBackupJob, headerLabel: string) {
  return findStatuses(findCell(mountTable([backupJob]), headerLabel))
}

describe('backup job', () => {
  it('links the backup job to the XO 5 backup overview, with the backup job icon', () => {
    expect(findLink(findCell(mountTable([createVmBackupJob({ name: 'Nightly backup' })]), t('backup-job')))).toEqual({
      text: 'Nightly backup',
      href: 'https://xo5.example.com/#/backup/overview',
      icon: 'object:backup-job',
    })
  })

  it('names a backup job without name as untitled', () => {
    const cell = findCell(mountTable([createVmBackupJob({ name: undefined })]), t('backup-job'))

    expect(cell.text()).toBe(t('untitled'))
  })
})

describe('type', () => {
  it('shows the first type of the backup job and the count of the other ones', () => {
    const backupJob = createVmBackupJob({
      srs: { id: 'sr-123' as XoSr['id'] },
      settings: { '': {}, ['schedule-1' as XoSchedule['id']]: { snapshotRetention: 1 } },
    })
    const cell = findCell(mountTable([backupJob]), t('type'))

    expect(cell.text()).toContain(t('backup:rolling-snapshot'))
    expect(cell.get('.extra-count').text()).toBe('+2')
  })

  it('shows no count for a backup job of a single type', () => {
    const cell = findCell(mountTable([createMirrorBackupJob()]), t('type'))

    expect(cell.text()).toBe(t('backup:vms-mirror'))
    expect(cell.find('.extra-count').exists()).toBe(false)
  })
})

describe('mode', () => {
  it('shows the mode of the backup job', () => {
    expect(findCell(mountTable([createVmBackupJob({ mode: 'delta' })]), t('mode')).text()).toBe(t('incremental'))
  })

  it('leaves the mode empty for a metadata job', () => {
    expect(findCell(mountTable([createMetadataBackupJob()]), t('mode')).text()).toBe('')
  })
})

describe('last runs', () => {
  it('shows the status of the last runs of the backup job', () => {
    const backupJob = createVmBackupJob()
    setBackupLogs(backupJob, ['failure', 'success'])

    expect(findJobCellStatuses(backupJob, t('last-n-runs', { n: 3 }))).toEqual(['failure', 'success'])
  })

  it('shows a loader while the backup logs are loading', () => {
    backupLogCollectionMock.areBackupLogsReady.value = false

    const cell = findCell(mountTable([createVmBackupJob()]), t('last-n-runs', { n: 3 }))

    expect(hasLoader(cell)).toBe(true)
  })
})

describe('status', () => {
  it('shows the backup job as enabled when at least one of its schedules is enabled', () => {
    const backupJob = createVmBackupJob()
    scheduleCollectionMock.schedules.value = [
      createSchedule({ id: 'schedule-1' as FrontXoSchedule['id'], jobId: backupJob.id, enabled: false }),
      createSchedule({ id: 'schedule-2' as FrontXoSchedule['id'], jobId: backupJob.id, enabled: true }),
    ]

    expect(findJobCellStatuses(backupJob, t('status'))).toEqual([true])
  })

  it('shows a backup job without enabled schedule as disabled', () => {
    expect(findJobCellStatuses(createVmBackupJob(), t('status'))).toEqual([false])
  })
})

describe('health check', () => {
  it('shows the health check status of the backup job', () => {
    const backupJob = createVmBackupJob({
      settings: {
        '': {},
        ['schedule-1' as XoSchedule['id']]: { healthCheckVmsWithTags: [], healthCheckSr: 'sr-123' as XoSr['id'] },
        ['schedule-2' as XoSchedule['id']]: {},
      },
    })

    expect(findJobCellStatuses(backupJob, t('health-check'))).toEqual(['at-least-one-enabled'])
  })

  it('leaves the health check empty for a metadata job', () => {
    expect(findJobCellStatuses(createMetadataBackupJob(), t('health-check'))).toEqual([])
  })
})

it('tells when there is no backup job', () => {
  expect(mountTable([]).text()).toContain(t('no-backup-job-available'))
})

it('selects the backup job of the row', async () => {
  const router = createTestRouter()
  await router.push('/admin/backup-and-replication/jobs')

  const backupJob = createVmBackupJob()
  const wrapper = mountTable([backupJob], router)

  await wrapper.get('tbody tr').getComponent(UiButtonIcon).trigger('click')
  await flushPromises()

  expect(router.currentRoute.value.query.id).toBe(backupJob.id)
})

describe('filters', () => {
  const lastRunsLabel = t('last-n-runs', 3)
  const lastDaysLabel = t('last-n-days', 7)

  it('shows every backup job when no option is selected', () => {
    const wrapper = mountTable([createNamedBackupJob('A'), createNamedBackupJob('B')])

    expect(findBackupJobNames(wrapper)).toEqual(['A', 'B'])
  })

  const filterCases: {
    name: string
    // The enabled state of each schedule of a job, the status of each of its runs, started that many days ago
    jobs: { name: string; schedules?: boolean[]; statuses?: FrontXoBackupLog['status'][]; daysAgo?: number }[]
    // The option picked in each filter, by its label
    picks: [filter: string, option: string][]
    shown: string[]
  }[] = [
    {
      name: 'filters the backup jobs on their status, enabled with at least one enabled schedule',
      jobs: [
        { name: 'Enabled job', schedules: [false, true] },
        { name: 'Disabled job', schedules: [false] },
        { name: 'Job without schedule' },
      ],
      picks: [[t('status'), t('disabled')]],
      shown: ['Disabled job', 'Job without schedule'],
    },
    {
      name: 'filters the backup jobs on the status of their last 3 finished runs',
      jobs: [
        { name: 'Failed job', statuses: ['pending', 'success', 'success', 'interrupted'] },
        { name: 'Good job', statuses: ['success', 'success', 'success', 'failure'] },
      ],
      picks: [[lastRunsLabel, t('backups:jobs:errors-detected')]],
      shown: ['Failed job'],
    },
    {
      name: 'filters the backup jobs on the status of their runs of the last 7 days',
      jobs: [
        { name: 'Recent job', statuses: ['success'] },
        { name: 'Old job', statuses: ['failure'], daysAgo: 10 },
      ],
      picks: [[lastDaysLabel, t('no-run')]],
      shown: ['Old job'],
    },
    {
      name: 'combines the filters',
      jobs: [
        { name: 'Enabled failed job', schedules: [true], statuses: ['failure'] },
        { name: 'Disabled failed job', statuses: ['failure'] },
        { name: 'Enabled job' },
      ],
      picks: [
        [t('status'), t('enabled')],
        [lastRunsLabel, t('backups:jobs:errors-detected')],
      ],
      shown: ['Enabled failed job'],
    },
  ]

  // Not `it.each`: its `$name` would quote and truncate the name
  for (const { name, jobs, picks, shown } of filterCases) {
    it(name, async () => {
      const backupJobs = jobs.map(job => {
        const backupJob = createNamedBackupJob(job.name)
        const { schedules = [], statuses = [], daysAgo } = job
        scheduleCollectionMock.schedules.value.push(
          ...schedules.map(enabled => createSchedule({ jobId: backupJob.id, enabled }))
        )
        setBackupLogs(
          backupJob,
          statuses,
          daysAgo === undefined ? undefined : Date.now() - daysAgo * 24 * 60 * 60 * 1000
        )

        return backupJob
      })

      const wrapper = mountTable(backupJobs)

      for (const [filter, option] of picks) {
        await pickFilterOption(wrapper, filter, option)
      }

      expect(findBackupJobNames(wrapper)).toEqual(shown)
    })
  }

  it('keeps the backup jobs matching one of the selected options', async () => {
    const skippedJob = createNamedBackupJob('Skipped job')
    const failedJob = createNamedBackupJob('Failed job')
    setBackupLogs(skippedJob, ['skipped', 'success'])
    setBackupLogs(failedJob, ['skipped', 'failure'])

    const wrapper = mountTable([skippedJob, failedJob, createNamedBackupJob('Job without run')])

    await pickFilterOption(wrapper, lastRunsLabel, t('backups:jobs:skipped-runs'))
    await pickSelectOption(wrapper, t('no-run'))

    expect(findBackupJobNames(wrapper)).toEqual(['Skipped job', 'Job without run'])
  })

  it('selects and deselects every option of a filter', async () => {
    const wrapper = mountTable([createNamedBackupJob('A')])

    await openFilter(wrapper, lastRunsLabel)

    await getButton(wrapper, t('action:select-all')).trigger('click')

    expect(wrapper.findAll('.ui-dropdown.selected')).toHaveLength(4)

    await getButton(wrapper, t('action:deselect-all')).trigger('click')

    expect(wrapper.findAll('.ui-dropdown.selected')).toHaveLength(0)
  })
})
