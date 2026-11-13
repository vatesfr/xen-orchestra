import BackupJobsTable from '@/modules/backup-job/components/list/BackupJobsTable.vue'
import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import type {
  FrontXoBackupLog,
  useXoBackupLogCollection,
} from '@/modules/backup-log/remote-resources/use-xo-backup-log-collection.ts'
import type {
  FrontXoSchedule,
  useXoScheduleCollection,
} from '@/modules/schedule/remote-resources/use-xo-schedule-collection.ts'
import type { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import { createMetadataBackupJob, createMirrorBackupJob, createVmBackupJob } from '@/test/create-backup-job.ts'
import { createBackupLog } from '@/test/create-backup-log.ts'
import { createSchedule } from '@/test/create-schedule.ts'
import { createTestRouter } from '@/test/create-test-router.ts'
import { getButton } from '@/test/get-button.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { pickSelectOption } from '@/test/select.ts'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiLoader from '@core/components/ui/loader/UiLoader.vue'
import type { XoSchedule, XoSr } from '@vates/types'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { ref } from 'vue'
import type { Router } from 'vue-router'

const { areBackupLogsReady, getLastNBackupLogsByJobId, backupLogsByJobId, schedulesByJobId } = vi.hoisted(() => ({
  areBackupLogsReady: { value: true },
  getLastNBackupLogsByJobId: vi.fn(),
  backupLogsByJobId: new Map<string, FrontXoBackupLog[]>(),
  schedulesByJobId: new Map<string, FrontXoSchedule[]>(),
}))

vi.mock(import('@/shared/remote-resources/use-xo-routes.ts'), () => ({
  useXoRoutes: (() => ({
    buildXo5Route: (path: string) => `https://xo5.example.com/#${path}`,
  })) as unknown as typeof useXoRoutes,
}))

vi.mock(import('@/modules/backup-log/remote-resources/use-xo-backup-log-collection.ts'), () => ({
  useXoBackupLogCollection: (() => ({
    areBackupLogsReady: ref(areBackupLogsReady.value),
    getLastNBackupLogsByJobId,
    backupLogsByJobId: ref(backupLogsByJobId),
  })) as unknown as typeof useXoBackupLogCollection,
}))

vi.mock(import('@/modules/schedule/remote-resources/use-xo-schedule-collection.ts'), () => ({
  useXoScheduleCollection: (() => ({
    schedulesByJobId: ref(schedulesByJobId),
  })) as unknown as typeof useXoScheduleCollection,
}))

beforeEach(() => {
  areBackupLogsReady.value = true
  getLastNBackupLogsByJobId.mockReset()
  getLastNBackupLogsByJobId.mockReturnValue([])
  backupLogsByJobId.clear()
  schedulesByJobId.clear()
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
  backupLogsByJobId.set(
    backupJob.id,
    statuses.map(status => createBackupLog({ jobId: backupJob.id, status, start }))
  )
}

function findBackupJobNames(wrapper: VueWrapper) {
  return wrapper.findAll('tbody tr').map(row => row.getComponent(UiLink).text())
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
  const headers = wrapper.findAll('thead th').map(header => header.text())

  return wrapper.findAll('tbody tr td')[headers.indexOf(headerLabel)]
}

describe('backup job', () => {
  it('links the backup job to the XO 5 backup overview, with the backup job icon', () => {
    const link = findCell(mountTable([createVmBackupJob({ name: 'Nightly backup' })]), t('backup-job')).getComponent(
      UiLink
    )

    expect(link.text()).toBe('Nightly backup')
    expect(link.attributes('href')).toBe('https://xo5.example.com/#/backup/overview')
    expect(link.props('icon')).toBe('object:backup-job')
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
    getLastNBackupLogsByJobId.mockReturnValue([
      createBackupLog({ status: 'failure' }),
      createBackupLog({ status: 'success' }),
    ])

    const cell = findCell(mountTable([createVmBackupJob()]), t('last-n-runs', { n: 3 }))

    const statuses = cell.findAllComponents(VtsStatus) as VueWrapper<InstanceType<typeof VtsStatus>>[]

    expect(statuses.map(status => status.props('status'))).toEqual(['failure', 'success'])
  })

  it('shows a loader while the backup logs are loading', () => {
    areBackupLogsReady.value = false

    const cell = findCell(mountTable([createVmBackupJob()]), t('last-n-runs', { n: 3 }))

    expect(cell.findComponent(UiLoader).exists()).toBe(true)
  })
})

describe('status', () => {
  it('shows the backup job as enabled when at least one of its schedules is enabled', () => {
    const backupJob = createVmBackupJob()
    schedulesByJobId.set(backupJob.id, [
      createSchedule({ id: 'schedule-1' as FrontXoSchedule['id'], jobId: backupJob.id, enabled: false }),
      createSchedule({ id: 'schedule-2' as FrontXoSchedule['id'], jobId: backupJob.id, enabled: true }),
    ])

    const cell = findCell(mountTable([backupJob]), t('status'))

    expect(cell.getComponent(VtsStatus).props('status')).toBe(true)
  })

  it('shows a backup job without enabled schedule as disabled', () => {
    const cell = findCell(mountTable([createVmBackupJob()]), t('status'))

    expect(cell.getComponent(VtsStatus).props('status')).toBe(false)
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

    const cell = findCell(mountTable([backupJob]), t('health-check'))

    expect(cell.getComponent(VtsStatus).props('status')).toBe('at-least-one-enabled')
  })

  it('leaves the health check empty for a metadata job', () => {
    const cell = findCell(mountTable([createMetadataBackupJob()]), t('health-check'))

    expect(cell.findComponent(VtsStatus).exists()).toBe(false)
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

  it('filters the backup jobs on their status, enabled with at least one enabled schedule', async () => {
    const enabledJob = createNamedBackupJob('Enabled job')
    const disabledJob = createNamedBackupJob('Disabled job')
    schedulesByJobId.set(enabledJob.id, [
      createSchedule({ jobId: enabledJob.id, enabled: false }),
      createSchedule({ jobId: enabledJob.id, enabled: true }),
    ])
    schedulesByJobId.set(disabledJob.id, [createSchedule({ jobId: disabledJob.id, enabled: false })])

    const wrapper = mountTable([enabledJob, disabledJob, createNamedBackupJob('Job without schedule')])

    await pickFilterOption(wrapper, t('status'), t('disabled'))

    expect(findBackupJobNames(wrapper)).toEqual(['Disabled job', 'Job without schedule'])
  })

  it('filters the backup jobs on the status of their last 3 finished runs', async () => {
    const failedJob = createNamedBackupJob('Failed job')
    const goodJob = createNamedBackupJob('Good job')
    setBackupLogs(failedJob, ['pending', 'success', 'success', 'interrupted'])
    setBackupLogs(goodJob, ['success', 'success', 'success', 'failure'])

    const wrapper = mountTable([failedJob, goodJob])

    await pickFilterOption(wrapper, lastRunsLabel, t('backups:jobs:errors-detected'))

    expect(findBackupJobNames(wrapper)).toEqual(['Failed job'])
  })

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

  it('filters the backup jobs on the status of their runs of the last 7 days', async () => {
    const recentJob = createNamedBackupJob('Recent job')
    const oldJob = createNamedBackupJob('Old job')
    setBackupLogs(recentJob, ['success'])
    setBackupLogs(oldJob, ['failure'], Date.now() - 10 * 24 * 60 * 60 * 1000)

    const wrapper = mountTable([recentJob, oldJob])

    await pickFilterOption(wrapper, lastDaysLabel, t('no-run'))

    expect(findBackupJobNames(wrapper)).toEqual(['Old job'])
  })

  it('combines the filters', async () => {
    const enabledFailedJob = createNamedBackupJob('Enabled failed job')
    const disabledFailedJob = createNamedBackupJob('Disabled failed job')
    schedulesByJobId.set(enabledFailedJob.id, [createSchedule({ jobId: enabledFailedJob.id, enabled: true })])
    setBackupLogs(enabledFailedJob, ['failure'])
    setBackupLogs(disabledFailedJob, ['failure'])

    const wrapper = mountTable([enabledFailedJob, disabledFailedJob, createNamedBackupJob('Enabled job')])

    await pickFilterOption(wrapper, t('status'), t('enabled'))
    await pickFilterOption(wrapper, lastRunsLabel, t('backups:jobs:errors-detected'))

    expect(findBackupJobNames(wrapper)).toEqual(['Enabled failed job'])
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
