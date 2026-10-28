import BackupJobInfosCard from '@/modules/backup-job/components/list/panel/cards/BackupJobInfosCard.vue'
import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import type { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { useXoPbdCollection } from '@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'
import type {
  FrontXoSr,
  useXoSrCollection,
} from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import { createMetadataBackupJob, createVmBackupJob } from '@/test/create-backup-job.ts'
import { createSr } from '@/test/create-sr.ts'
import { findCardLabelledValues } from '@/test/find-rendered-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import VtsCopyAllMenuItem from '@core/components/copy-all-menu-item/VtsCopyAllMenuItem.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import type { XoSchedule } from '@vates/types'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'

const { srs } = vi.hoisted(() => ({
  srs: [] as FrontXoSr[],
}))

vi.mock(import('@/shared/remote-resources/use-xo-routes.ts'), () => ({
  useXoRoutes: (() => ({
    buildXo5Route: (path: string) => `https://xo5.example.com/#${path}`,
  })) as unknown as typeof useXoRoutes,
}))

vi.mock(import('@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'), () => ({
  useXoSrCollection: (() => ({
    getSrById: (id: FrontXoSr['id']) => srs.find(sr => sr.id === id),
  })) as unknown as typeof useXoSrCollection,
}))

vi.mock(import('@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'), () => ({
  useXoPbdCollection: (() => ({
    getPbdsByIds: () => [],
    pbdsBySr: ref(new Map()),
  })) as unknown as typeof useXoPbdCollection,
}))

vi.mock(import('@/modules/host/remote-resources/use-xo-host-collection.ts'), () => ({
  useXoHostCollection: (() => ({ getHostById: () => undefined })) as unknown as typeof useXoHostCollection,
}))

const firstScheduleId = 'schedule-1' as XoSchedule['id']
const secondScheduleId = 'schedule-2' as XoSchedule['id']

const healthCheckSr = createSr({ id: 'sr-1' as FrontXoSr['id'], name_label: 'Health check SR' })

beforeEach(() => {
  srs.splice(0, srs.length, healthCheckSr)
})

function mountInfosCard(backupJob: FrontAnyXoBackupJob) {
  return mount(BackupJobInfosCard, {
    props: { backupJob },
    global: createGlobalTestConfig(),
  })
}

function findValues(wrapper: ReturnType<typeof mountInfosCard>) {
  return wrapper.findAll('.vts-card-row-key-value').map(row => row.get('.value').text())
}

it('titles the card with the backup job, linked to the XO 5 backup overview', () => {
  const backupJob = createVmBackupJob({ name: 'Nightly backup' })
  const title = mountInfosCard(backupJob).getComponent(UiPanelCardTitle)

  expect(title.props()).toMatchObject({
    id: backupJob.id,
    label: 'Nightly backup',
    href: 'https://xo5.example.com/#/backup/overview',
    icon: 'object:backup-job',
  })
})

it('names a backup job without name as untitled', () => {
  expect(
    mountInfosCard(createVmBackupJob({ name: undefined }))
      .getComponent(UiPanelCardTitle)
      .props('label')
  ).toBe(t('untitled'))
})

it('lists every type of the backup job, offering to copy them all', () => {
  const backupJob = createVmBackupJob({
    srs: { id: 'sr-2' as FrontXoSr['id'] },
    settings: { '': {}, [firstScheduleId]: { snapshotRetention: 1 } },
  })
  const wrapper = mountInfosCard(backupJob)
  const typeLabels = [t('backup:rolling-snapshot'), t('backup:vms-backup'), t('backup:vms-replication')]

  expect(findValues(wrapper).slice(0, 3)).toEqual(typeLabels)
  expect(wrapper.getComponent(VtsCopyAllMenuItem).props('values')).toEqual(typeLabels)
})

it('offers no copy of all the types for a backup job of a single type', () => {
  expect(mountInfosCard(createVmBackupJob()).findComponent(VtsCopyAllMenuItem).exists()).toBe(false)
})

it('shows the mode and the health check status of the backup job', () => {
  const backupJob = createVmBackupJob({
    mode: 'delta',
    settings: {
      '': {},
      [firstScheduleId]: { healthCheckVmsWithTags: [], healthCheckSr: healthCheckSr.id },
      [secondScheduleId]: {},
    },
  })
  const wrapper = mountInfosCard(backupJob)

  expect(findCardLabelledValues(wrapper)).toMatchObject({
    [t('mode')]: t('incremental'),
    [t('health-check-sr')]: 'Health check SR',
  })
  expect(wrapper.getComponent(VtsStatus).props('status')).toBe('at-least-one-enabled')
})

it('links each health check SR to its page, and shows the id of a missing one', () => {
  const backupJob = createVmBackupJob({
    settings: {
      '': {},
      [firstScheduleId]: { healthCheckVmsWithTags: [], healthCheckSr: healthCheckSr.id },
      [secondScheduleId]: { healthCheckVmsWithTags: [], healthCheckSr: 'sr-missing' as FrontXoSr['id'] },
    },
  })
  const wrapper = mountInfosCard(backupJob)
  const srLinks = wrapper.findAll('.vts-card-row-key-value').flatMap(row => row.findAllComponents(UiLink))

  expect(srLinks.map(link => [link.text(), link.attributes('href')])).toEqual([['Health check SR', '/sr/sr-1/general']])
  expect(findValues(wrapper)).toContain('sr-missing')
})

it('shows no mode nor health check for a metadata job', () => {
  const labelledValues = findCardLabelledValues(mountInfosCard(createMetadataBackupJob()))

  expect(labelledValues[t('mode')]).toBe('')
  expect(Object.keys(labelledValues)).not.toContain(t('health-check'))
  expect(Object.keys(labelledValues)).not.toContain(t('health-check-sr'))
})
