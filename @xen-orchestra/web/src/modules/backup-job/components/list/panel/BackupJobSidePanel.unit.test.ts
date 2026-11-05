import BackupJobSidePanel from '@/modules/backup-job/components/list/panel/BackupJobSidePanel.vue'
import BackupJobBackedUpVmsCard from '@/modules/backup-job/components/list/panel/cards/BackupJobBackedUpVmsCard.vue'
import BackupJobInfosCard from '@/modules/backup-job/components/list/panel/cards/BackupJobInfosCard.vue'
import BackupJobLogsCard from '@/modules/backup-job/components/list/panel/cards/BackupJobLogsCard.vue'
import BackupJobSchedulesCard from '@/modules/backup-job/components/list/panel/cards/BackupJobSchedulesCard.vue'
import BackupJobSettingsCard from '@/modules/backup-job/components/list/panel/cards/BackupJobSettingsCard.vue'
import BackupJobTargetsCard from '@/modules/backup-job/components/list/panel/cards/BackupJobTargetsCard.vue'
import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import type {
  FrontXoBackupLog,
  useXoBackupLogCollection,
} from '@/modules/backup-log/remote-resources/use-xo-backup-log-collection.ts'
import type { useXoBackupRepositoryCollection } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import type { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { useXoPbdCollection } from '@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'
import type { useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { useXoProxyCollection } from '@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'
import type {
  FrontXoSchedule,
  useXoScheduleCollection,
} from '@/modules/schedule/remote-resources/use-xo-schedule-collection.ts'
import type { useXoSrCollection } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import { createMetadataBackupJob, createVmBackupJob } from '@/test/create-backup-job.ts'
import { createBackupLog } from '@/test/create-backup-log.ts'
import { createSchedule } from '@/test/create-schedule.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'

const { schedulesByJobId, backupLogsByJobId } = vi.hoisted(() => ({
  schedulesByJobId: new Map<string, FrontXoSchedule[]>(),
  backupLogsByJobId: new Map<string, FrontXoBackupLog[]>(),
}))

vi.mock(import('@/shared/remote-resources/use-xo-routes.ts'), () => ({
  useXoRoutes: (() => ({
    buildXo5Route: (path: string) => `https://xo5.example.com/#${path}`,
  })) as unknown as typeof useXoRoutes,
}))

vi.mock(import('@/modules/schedule/remote-resources/use-xo-schedule-collection.ts'), async () => {
  const { computed: vueComputed, ref: vueRef } = await import('vue')

  return {
    useXoScheduleCollection: (() => ({
      schedulesByJobId: vueRef(schedulesByJobId),
      useGetScheduleById: () => vueComputed(() => undefined),
    })) as unknown as typeof useXoScheduleCollection,
  }
})

vi.mock(import('@/modules/backup-log/remote-resources/use-xo-backup-log-collection.ts'), () => ({
  useXoBackupLogCollection: (() => ({
    getLastNBackupLogsByJobId: (jobId: string) => backupLogsByJobId.get(jobId) ?? [],
  })) as unknown as typeof useXoBackupLogCollection,
}))

vi.mock(import('@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'), () => ({
  useXoSrCollection: (() => ({
    getSrsByIds: () => [],
    getSrById: () => undefined,
  })) as unknown as typeof useXoSrCollection,
}))

vi.mock(import('@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'), () => ({
  useXoBackupRepositoryCollection: (() => ({
    getBackupRepositoriesByIds: () => [],
  })) as unknown as typeof useXoBackupRepositoryCollection,
}))

vi.mock(import('@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'), async () => {
  const { computed: vueComputed } = await import('vue')

  return {
    useXoProxyCollection: (() => ({
      useGetProxyById: () => vueComputed(() => undefined),
    })) as unknown as typeof useXoProxyCollection,
  }
})

vi.mock(import('@/modules/vm/remote-resources/use-xo-vm-collection.ts'), async () => {
  const { ref: vueRef } = await import('vue')

  return {
    useXoVmCollection: (() => ({
      vms: vueRef([]),
      getVmsByIds: () => [],
    })) as unknown as typeof useXoVmCollection,
  }
})

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

beforeEach(() => {
  schedulesByJobId.clear()
  backupLogsByJobId.clear()
})

function mountSidePanel(backupJob: FrontAnyXoBackupJob) {
  return mount(BackupJobSidePanel, {
    props: { backupJob },
    global: createGlobalTestConfig(),
  })
}

it('shows every card of a VM backup job', () => {
  schedulesByJobId.set(vmBackupJob.id, [createSchedule({ jobId: vmBackupJob.id })])
  backupLogsByJobId.set(vmBackupJob.id, [createBackupLog({ jobId: vmBackupJob.id })])

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
  schedulesByJobId.set(vmBackupJob.id, [
    createSchedule({ id: 'schedule-1' as FrontXoSchedule['id'], jobId: vmBackupJob.id }),
    createSchedule({ id: 'schedule-2' as FrontXoSchedule['id'], jobId: vmBackupJob.id }),
  ])

  const alert = mountSidePanel(vmBackupJob).getComponent(UiAlert)

  expect(alert.text()).toContain(t('multiple-schedules'))
  expect(alert.text()).toContain(t('multiple-schedules-advice'))
})

it('gives no advice for a backup job with a single schedule', () => {
  schedulesByJobId.set(vmBackupJob.id, [createSchedule({ jobId: vmBackupJob.id })])

  expect(mountSidePanel(vmBackupJob).findComponent(UiAlert).exists()).toBe(false)
})

it('shows nothing without selected backup job', () => {
  const wrapper = mount(BackupJobSidePanel, { props: {}, global: createGlobalTestConfig() })

  expect(wrapper.findComponent(BackupJobInfosCard).exists()).toBe(false)
})
