import BackupJobMoreActions from '@/modules/backup-job/components/actions/BackupJobMoreActions.vue'
import BackupJobDeleteButton from '@/modules/backup-job/components/actions/delete/BackupJobDeleteButton.vue'
import BackupJobSidePanel from '@/modules/backup-job/components/list/panel/BackupJobSidePanel.vue'
import BackupJobBackedUpVmsCard from '@/modules/backup-job/components/list/panel/cards/BackupJobBackedUpVmsCard.vue'
import BackupJobInfosCard from '@/modules/backup-job/components/list/panel/cards/BackupJobInfosCard.vue'
import BackupJobLogsCard from '@/modules/backup-job/components/list/panel/cards/BackupJobLogsCard.vue'
import BackupJobSchedulesCard from '@/modules/backup-job/components/list/panel/cards/BackupJobSchedulesCard.vue'
import BackupJobSettingsCard from '@/modules/backup-job/components/list/panel/cards/BackupJobSettingsCard.vue'
import BackupJobTargetsCard from '@/modules/backup-job/components/list/panel/cards/BackupJobTargetsCard.vue'
import type {
  FrontAnyXoBackupJob,
  FrontXoVmBackupJob,
} from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import type {
  FrontXoSchedule,
  useXoScheduleCollection,
} from '@/modules/schedule/remote-resources/use-xo-schedule-collection.ts'
import type { useXoSrCollection } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import type { useXoVdiCollection } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import { createMetadataBackupJob, createVmBackupJob } from '@/test/create-backup-job.ts'
import { createBackupLog } from '@/test/create-backup-log.ts'
import { createBr } from '@/test/create-br.ts'
import { createSchedule } from '@/test/create-schedule.ts'
import { createSr } from '@/test/create-sr.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { backupLogCollectionMock, mockXoBackupLogCollection } from '@/test/mock-xo-backup-log-collection.ts'
import { xoCollectionsMock, mockXoCollections } from '@/test/mock-xo-collections.ts'
import { proxyCollectionMock, mockXoProxyCollection } from '@/test/mock-xo-proxy-collection.ts'
import { mockXoRoutes } from '@/test/mock-xo-routes.ts'
import { scheduleCollectionMock, mockXoScheduleCollection } from '@/test/mock-xo-schedule-collection.ts'
import { vmCollectionMock, mockXoVmCollection } from '@/test/mock-xo-vm-collection.ts'
import { mockXoVmDeviceCollections } from '@/test/mock-xo-vm-device-collections.ts'
import { mockModule } from '@/test/spy-on-module.ts'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'

mockXoRoutes()

mockXoScheduleCollection()

mockXoBackupLogCollection()

mockXoCollections('host', 'pbd', 'pool', 'sr')

vi.mock(import('@/modules/backup-log/remote-resources/use-xo-backup-log-collection.ts'), () => ({
  useXoBackupLogCollection: (() => ({
    getLastNBackupLogsByJobId: (jobId: string) => backupLogsByJobId.get(jobId) ?? [],
  })) as unknown as typeof useXoBackupLogCollection,
}))

vi.mock(import('@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'), () => ({
  useXoSrCollection: (() => ({
    srs: ref([]),
    getSrsByIds: () => [],
    getSrById: () => undefined,
  })) as unknown as typeof useXoSrCollection,
}))

vi.mock(import('@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'), () => ({
  useXoBackupRepositoryCollection: (() => ({
    backupRepositories: ref([]),
    getBackupRepositoriesByIds: () => [],
  })) as unknown as typeof useXoBackupRepositoryCollection,
}))

mockXoProxyCollection()

mockXoVmCollection()

vi.mock(import('@/modules/vm/remote-resources/use-xo-vm-collection.ts'), async () => {
  const { ref: vueRef } = await import('vue')

  return {
    useXoVmCollection: (() => ({
      vms: vueRef([]),
      getVmsByIds: () => [],
    })) as unknown as typeof useXoVmCollection,
  }
})

vi.mock(import('@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'), () => ({
  useXoVbdCollection: (() => ({ getVbdsByIds: () => [] })) as unknown as typeof useXoVbdCollection,
}))

vi.mock(import('@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'), () => ({
  useXoVdiCollection: (() => ({ getVdiById: () => undefined })) as unknown as typeof useXoVdiCollection,
}))

vi.mock(import('@/modules/pool/remote-resources/use-xo-pool-collection.ts'), () => ({
  useXoPoolCollection: (() => ({ getPoolsByIds: () => [] })) as unknown as typeof useXoPoolCollection,
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

const vmBackupJob = createVmBackupJob()

const backupRepositories: FrontXoBackupRepository[] = []

const PROXY_ID = 'proxy-1' as FrontXoProxy['id']

const mainBr = createBr({ id: 'br-main' as FrontXoBackupRepository['id'], name: 'Main BR', proxy: PROXY_ID })
const otherBr = createBr({ id: 'br-other' as FrontXoBackupRepository['id'], name: 'Other BR', proxy: PROXY_ID })
const disabledBr = createBr({ id: 'br-disabled' as FrontXoBackupRepository['id'], proxy: PROXY_ID, enabled: false })
const otherProxyBr = createBr({
  id: 'br-other-proxy' as FrontXoBackupRepository['id'],
  proxy: 'proxy-2' as FrontXoProxy['id'],
})

const localSr = createSr({ id: 'sr-local' as FrontXoSr['id'], name_label: 'Local SR' })
const nfsSr = createSr({ id: 'sr-nfs' as FrontXoSr['id'], name_label: 'NFS SR' })
const isoSr = createSr({ id: 'sr-iso' as FrontXoSr['id'], name_label: 'ISO SR', content_type: 'iso' })

beforeEach(() => {
  scheduleCollectionMock.reset()
  backupLogCollectionMock.reset()
  proxyCollectionMock.reset()
  xoCollectionsMock.reset()
  vmCollectionMock.reset()
  xoCollectionsMock.srs.value = [localSr, nfsSr, isoSr]
  backupRepositories.splice(0, backupRepositories.length, mainBr, otherBr, disabledBr, otherProxyBr)
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

describe('targets of a dynamic selection', () => {
  function mountDynamicJob(remotes: string, srsExpression?: string) {
    const backupJob = createVmBackupJob({
      proxy: PROXY_ID as FrontXoVmBackupJob['proxy'],
      remotes: remotes as unknown as FrontXoVmBackupJob['remotes'],
      srs: srsExpression as unknown as FrontXoVmBackupJob['srs'],
    })

    return mountSidePanel(backupJob).getComponent(BackupJobTargetsCard)
  }

  it('targets every enabled backup repository of the job proxy', () => {
    const card = mountDynamicJob('*')

    expect(card.props('backupRepositoryTargets')).toEqual([mainBr, otherBr])
    expect(card.props('backupRepositoryExpression')).toBe('*')
  })

  it('targets the backup repositories matching the query, shown without its context', () => {
    const card = mountDynamicJob('backupRepository:(name:Main)')

    expect(card.props('backupRepositoryTargets')).toEqual([mainBr])
    expect(card.props('backupRepositoryExpression')).toBe('name:Main')
  })

  it('targets every writable storage repository', () => {
    const card = mountDynamicJob('*', '*')

    expect(card.props('storageRepositoryTargets')).toEqual([localSr, nfsSr])
    expect(card.props('storageRepositoryExpression')).toBe('*')
  })

  it('targets the storage repositories matching the query, shown without its context', () => {
    const card = mountDynamicJob('*', 'sr:(name_label:NFS)')

    expect(card.props('storageRepositoryTargets')).toEqual([nfsSr])
    expect(card.props('storageRepositoryExpression')).toBe('name_label:NFS')
  })
})
