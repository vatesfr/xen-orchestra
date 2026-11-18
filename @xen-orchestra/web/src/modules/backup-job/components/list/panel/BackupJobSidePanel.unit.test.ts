import BackupJobMoreActions from '@/modules/backup-job/components/actions/BackupJobMoreActions.vue'
import BackupJobDeleteButton from '@/modules/backup-job/components/actions/delete/BackupJobDeleteButton.vue'
import BackupJobSidePanel from '@/modules/backup-job/components/list/panel/BackupJobSidePanel.vue'
import BackupJobBackedUpVmsCard from '@/modules/backup-job/components/list/panel/cards/BackupJobBackedUpVmsCard.vue'
import BackupJobInfosCard from '@/modules/backup-job/components/list/panel/cards/BackupJobInfosCard.vue'
import BackupJobLogsCard from '@/modules/backup-job/components/list/panel/cards/BackupJobLogsCard.vue'
import BackupJobSchedulesCard from '@/modules/backup-job/components/list/panel/cards/BackupJobSchedulesCard.vue'
import BackupJobSettingsCard from '@/modules/backup-job/components/list/panel/cards/BackupJobSettingsCard.vue'
import BackupJobTargetsCard from '@/modules/backup-job/components/list/panel/cards/BackupJobTargetsCard.vue'
import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import type { useXoBackupRepositoryCollection } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import type { FrontXoSchedule } from '@/modules/schedule/remote-resources/use-xo-schedule-collection.ts'
import { createMetadataBackupJob, createVmBackupJob } from '@/test/create-backup-job.ts'
import { createBackupLog } from '@/test/create-backup-log.ts'
import { createSchedule } from '@/test/create-schedule.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { backupLogCollectionMock } from '@/test/mock-xo-backup-log-collection.ts'
import { xoCollectionsMock } from '@/test/mock-xo-collections.ts'
import { proxyCollectionMock } from '@/test/mock-xo-proxy-collection.ts'
import { scheduleCollectionMock } from '@/test/mock-xo-schedule-collection.ts'
import { vmCollectionMock } from '@/test/mock-xo-vm-collection.ts'
import { mockModule } from '@/test/spy-on-module.ts'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import { mount } from '@vue/test-utils'

mockModule(import('@/shared/remote-resources/use-xo-routes.ts'), () => import('@/test/mock-xo-routes.ts'))

mockModule(
  import('@/modules/schedule/remote-resources/use-xo-schedule-collection.ts'),
  () => import('@/test/mock-xo-schedule-collection.ts')
)

mockModule(
  import('@/modules/backup-log/remote-resources/use-xo-backup-log-collection.ts'),
  () => import('@/test/mock-xo-backup-log-collection.ts')
)

mockModule(
  import('@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)

mockModule(import('@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'), () => ({
  useXoBackupRepositoryCollection: (() => ({
    getBackupRepositoriesByIds: () => [],
  })) as unknown as typeof useXoBackupRepositoryCollection,
}))

mockModule(
  import('@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'),
  () => import('@/test/mock-xo-proxy-collection.ts')
)

mockModule(
  import('@/modules/vm/remote-resources/use-xo-vm-collection.ts'),
  () => import('@/test/mock-xo-vm-collection.ts')
)

mockModule(
  import('@/modules/pool/remote-resources/use-xo-pool-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)

mockModule(
  import('@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)

mockModule(
  import('@/modules/host/remote-resources/use-xo-host-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)

const vmBackupJob = createVmBackupJob()

beforeEach(() => {
  scheduleCollectionMock.reset()
  backupLogCollectionMock.reset()
  proxyCollectionMock.reset()
  xoCollectionsMock.reset()
  vmCollectionMock.reset()
})

const global = { ...createGlobalTestConfig(), stubs: { BackupJobDeleteButton: true, BackupJobMoreActions: true } }

function mountSidePanel(backupJob: FrontAnyXoBackupJob) {
  return mount(BackupJobSidePanel, {
    props: { backupJob },
    global,
  })
}

it('shows every card of a VM backup job', () => {
  scheduleCollectionMock.schedules.value = [createSchedule({ jobId: vmBackupJob.id })]
  backupLogCollectionMock.backupLogs.value = [createBackupLog({ jobId: vmBackupJob.id })]

  const wrapper = mountSidePanel(vmBackupJob)

  expect(wrapper.findComponent(BackupJobInfosCard).exists()).toBe(true)
  expect(wrapper.findComponent(BackupJobSchedulesCard).exists()).toBe(true)
  expect(wrapper.findComponent(BackupJobLogsCard).exists()).toBe(true)
  expect(wrapper.findComponent(BackupJobBackedUpVmsCard).exists()).toBe(true)
  expect(wrapper.findComponent(BackupJobTargetsCard).exists()).toBe(true)
  expect(wrapper.findComponent(BackupJobSettingsCard).exists()).toBe(true)
})

it('hides the schedules and the last runs of a backup job without any', () => {
  const wrapper = mountSidePanel(vmBackupJob)

  expect(wrapper.findComponent(BackupJobSchedulesCard).exists()).toBe(false)
  expect(wrapper.findComponent(BackupJobLogsCard).exists()).toBe(false)
})

it('hides the backed up VMs of a metadata job', () => {
  expect(mountSidePanel(createMetadataBackupJob()).findComponent(BackupJobBackedUpVmsCard).exists()).toBe(false)
})

it('advises to split a backup job with several schedules', () => {
  scheduleCollectionMock.schedules.value = [
    createSchedule({ id: 'schedule-1' as FrontXoSchedule['id'], jobId: vmBackupJob.id }),
    createSchedule({ id: 'schedule-2' as FrontXoSchedule['id'], jobId: vmBackupJob.id }),
  ]

  const alert = mountSidePanel(vmBackupJob).getComponent(UiAlert)

  expect(alert.text()).toContain(t('multiple-schedules'))
  expect(alert.text()).toContain(t('multiple-schedules-advice'))
})

it('gives no advice for a backup job with a single schedule', () => {
  scheduleCollectionMock.schedules.value = [createSchedule({ jobId: vmBackupJob.id })]

  expect(mountSidePanel(vmBackupJob).findComponent(UiAlert).exists()).toBe(false)
})

it('shows nothing without selected backup job', () => {
  const wrapper = mount(BackupJobSidePanel, { props: {}, global })

  expect(wrapper.findComponent(BackupJobInfosCard).exists()).toBe(false)
  expect(wrapper.findComponent(BackupJobDeleteButton).exists()).toBe(false)
})

it('offers to delete the backup job directly', () => {
  expect(mountSidePanel(vmBackupJob).getComponent(BackupJobDeleteButton).props('backupJob')).toEqual(vmBackupJob)
})

it('offers the other actions of the backup job in the more actions menu', async () => {
  const wrapper = mountSidePanel(vmBackupJob)

  expect(wrapper.findComponent(BackupJobMoreActions).exists()).toBe(false)

  await wrapper.get(`[aria-label="${t('more-actions')}"]`).trigger('click')

  expect(wrapper.getComponent(BackupJobMoreActions).props('backupJob')).toEqual(vmBackupJob)
})

it('gives the schedules of the backup job to the infos card', () => {
  const schedules = [createSchedule({ jobId: vmBackupJob.id })]
  scheduleCollectionMock.schedules.value = schedules

  expect(mountSidePanel(vmBackupJob).getComponent(BackupJobInfosCard).props('schedules')).toEqual(schedules)
})
