import BackupJobSettingsCard from '@/modules/backup-job/components/list/panel/cards/BackupJobSettingsCard.vue'
import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import type { FrontXoProxy, useXoProxyCollection } from '@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'
import { createMetadataBackupJob, createMirrorBackupJob, createVmBackupJob } from '@/test/create-backup-job.ts'
import { findCardLabelledValues } from '@/test/find-rendered-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import VtsCopyAllMenuItem from '@core/components/copy-all-menu-item/VtsCopyAllMenuItem.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import type { XoSchedule } from '@vates/types'
import { mount } from '@vue/test-utils'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'

const { proxies } = vi.hoisted(() => ({
  proxies: [] as FrontXoProxy[],
}))

vi.mock(import('@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'), () => ({
  useXoProxyCollection: (() => ({
    useGetProxyById: (id: MaybeRefOrGetter<FrontXoProxy['id'] | undefined>) =>
      computed(() => proxies.find(proxy => proxy.id === toValue(id))),
  })) as unknown as typeof useXoProxyCollection,
}))

const scheduleId = 'schedule-1' as XoSchedule['id']

const recipients = [
  'a@example.com',
  'b@example.com',
  'c@example.com',
  'd@example.com',
  'e@example.com',
  'f@example.com',
]

beforeEach(() => {
  proxies.length = 0
})

function mountSettingsCard(backupJob: FrontAnyXoBackupJob) {
  return mount(BackupJobSettingsCard, {
    props: { backupJob },
    global: createGlobalTestConfig(),
  })
}

function findLabels(wrapper: ReturnType<typeof mountSettingsCard>) {
  return Object.keys(findCardLabelledValues(wrapper))
}

function findRecipients(wrapper: ReturnType<typeof mountSettingsCard>) {
  const rows = wrapper.findAll('.vts-card-row-key-value')
  const firstRecipientIndex = rows.findIndex(row => row.get('.key').text() === t('report-recipients'))

  return rows
    .slice(firstRecipientIndex)
    .filter((row, index) => index === 0 || row.get('.key').text() === '')
    .map(row => row.get('.value').text())
}

describe('rows', () => {
  it('shows every setting of a full VM backup job without rolling snapshot', () => {
    expect(findLabels(mountSettingsCard(createVmBackupJob({ mode: 'full' })))).toEqual([
      t('proxy'),
      t('snapshot-mode'),
      t('vm-backup-failure-number-of-retries'),
      t('timeout'),
      t('speed-limit'),
      t('report-when'),
      t('report-recipients'),
      t('concurrency'),
      t('compression'),
      t('offline-backup'),
      t('shorter-backup-reports'),
      t('merge-backups-synchronously'),
    ])
  })

  it('hides the compression of a delta VM backup job', () => {
    expect(findLabels(mountSettingsCard(createVmBackupJob({ mode: 'delta' })))).not.toContain(t('compression'))
  })

  it('hides the offline backup of a VM backup job keeping snapshots', () => {
    const backupJob = createVmBackupJob({ settings: { '': {}, [scheduleId]: { snapshotRetention: 1 } } })

    expect(findLabels(mountSettingsCard(backupJob))).not.toContain(t('offline-backup'))
  })

  it('only shows the settings of a mirror backup job', () => {
    expect(findLabels(mountSettingsCard(createMirrorBackupJob()))).toEqual([
      t('proxy'),
      t('vm-backup-failure-number-of-retries'),
      t('timeout'),
      t('speed-limit'),
      t('report-when'),
      t('report-recipients'),
      t('concurrency'),
      t('shorter-backup-reports'),
      t('merge-backups-synchronously'),
    ])
  })

  it('only shows the settings of a metadata backup job', () => {
    expect(findLabels(mountSettingsCard(createMetadataBackupJob()))).toEqual([
      t('proxy'),
      t('report-when'),
      t('report-recipients'),
      t('shorter-backup-reports'),
    ])
  })
})

describe('values', () => {
  it('shows the values of the settings', () => {
    proxies.push({ id: 'proxy-123' as FrontXoProxy['id'], name: 'Main proxy' })

    const backupJob = createVmBackupJob({
      mode: 'full',
      compression: 'zstd',
      proxy: 'proxy-123' as FrontXoProxy['id'],
      settings: {
        '': {
          checkpointSnapshot: true,
          offlineSnapshot: false,
          nRetriesVmBackupFailures: 2,
          concurrency: 3,
          reportWhen: 'always',
          backupReportTpl: 'compactMjml',
          mergeBackupsSynchronously: true,
          offlineBackup: false,
        },
      },
    })

    expect(findCardLabelledValues(mountSettingsCard(backupJob))).toMatchObject({
      [t('proxy')]: 'Main proxy',
      [t('snapshot-mode')]: t('with-memory'),
      [t('vm-backup-failure-number-of-retries')]: '2',
      [t('report-when')]: t('report-when:always'),
      [t('concurrency')]: '3',
      [t('compression')]: t('zstd'),
      [t('offline-backup')]: t('disabled'),
      [t('shorter-backup-reports')]: t('enabled'),
      [t('merge-backups-synchronously')]: t('enabled'),
    })
  })

  it('leaves empty the settings that are not set', () => {
    expect(findCardLabelledValues(mountSettingsCard(createVmBackupJob({ mode: 'full' })))).toMatchObject({
      [t('proxy')]: '',
      [t('vm-backup-failure-number-of-retries')]: '',
      [t('timeout')]: '',
      [t('speed-limit')]: '',
      [t('report-when')]: t('report-when:always'),
      [t('report-recipients')]: '',
      [t('concurrency')]: '',
      [t('compression')]: t('disabled'),
    })
  })
})

describe('report recipients', () => {
  it('shows the first recipients, then all of them on demand', async () => {
    const wrapper = mountSettingsCard(createMetadataBackupJob({ settings: { '': { reportRecipients: recipients } } }))

    expect(findRecipients(wrapper)).toEqual(recipients.slice(0, 5))

    const seeMoreButton = wrapper.getComponent(UiButton)

    expect(seeMoreButton.text()).toBe(t('action:see-n-more', { n: 1 }))

    await seeMoreButton.trigger('click')

    expect(findRecipients(wrapper)).toEqual(recipients)
    expect(seeMoreButton.text()).toBe(t('action:see-less'))
  })

  it('offers to copy all the recipients', () => {
    const wrapper = mountSettingsCard(createMetadataBackupJob({ settings: { '': { reportRecipients: recipients } } }))

    expect(wrapper.getComponent(VtsCopyAllMenuItem).props('values')).toEqual(recipients)
  })

  it('offers no copy of all the recipients nor more recipients for a single one', () => {
    const wrapper = mountSettingsCard(
      createMetadataBackupJob({ settings: { '': { reportRecipients: ['a@example.com'] } } })
    )

    expect(wrapper.findComponent(VtsCopyAllMenuItem).exists()).toBe(false)
    expect(wrapper.findComponent(UiButton).exists()).toBe(false)
  })
})
