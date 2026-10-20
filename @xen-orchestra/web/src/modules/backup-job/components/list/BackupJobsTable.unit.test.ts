import type { useXoBackupLogCollection } from '@/modules/backup/remote-resources/use-xo-backup-log-collection.ts'
import BackupJobsTable from '@/modules/backup-job/components/list/BackupJobsTable.vue'
import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import type { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import { createMetadataBackupJob, createMirrorBackupJob, createVmBackupJob } from '@/test/create-backup-job.ts'
import { createBackupLog } from '@/test/create-backup-log.ts'
import { createTestRouter } from '@/test/create-test-router.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiLoader from '@core/components/ui/loader/UiLoader.vue'
import type { XoSchedule, XoSr } from '@vates/types'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { ref } from 'vue'
import type { Router } from 'vue-router'

const { areBackupLogsReady, getLastNBackupLogsByJobId } = vi.hoisted(() => ({
  areBackupLogsReady: { value: true },
  getLastNBackupLogsByJobId: vi.fn(),
}))

vi.mock(import('@/shared/remote-resources/use-xo-routes.ts'), () => ({
  useXoRoutes: (() => ({
    buildXo5Route: (path: string) => `https://xo5.example.com/#${path}`,
  })) as unknown as typeof useXoRoutes,
}))

vi.mock(import('@/modules/backup/remote-resources/use-xo-backup-log-collection.ts'), () => ({
  useXoBackupLogCollection: (() => ({
    areBackupLogsReady: ref(areBackupLogsReady.value),
    getLastNBackupLogsByJobId,
  })) as unknown as typeof useXoBackupLogCollection,
}))

beforeEach(() => {
  areBackupLogsReady.value = true
  getLastNBackupLogsByJobId.mockReset()
  getLastNBackupLogsByJobId.mockReturnValue([])
})

function mountTable(backupJobs: FrontAnyXoBackupJob[], router?: Router) {
  return mount(BackupJobsTable, {
    props: { backupJobs, busy: false, error: false },
    global: createGlobalTestConfig({ router }),
  })
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

    expect(cell.findAllComponents(VtsStatus).map(status => status.props('status'))).toEqual(['failure', 'success'])
  })

  it('shows a loader while the backup logs are loading', () => {
    areBackupLogsReady.value = false

    const cell = findCell(mountTable([createVmBackupJob()]), t('last-n-runs', { n: 3 }))

    expect(cell.findComponent(UiLoader).exists()).toBe(true)
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
