import BackupJobFormCheckboxGroup from '@/modules/backup-job/components/form/inputs/BackupJobFormCheckboxGroup.vue'
import BackupJobTargetStep from '@/modules/backup-job/components/form/steps/BackupJobTargetStep.vue'
import BackupJobTargetBackupRepositorySection from '@/modules/backup-job/components/form/target/BackupJobTargetBackupRepositorySection.vue'
import BackupJobTargetHealthCheckSection from '@/modules/backup-job/components/form/target/BackupJobTargetHealthCheckSection.vue'
import BackupJobTargetStorageRepositorySection from '@/modules/backup-job/components/form/target/BackupJobTargetStorageRepositorySection.vue'
import type { BackupJobDataSource } from '@/modules/backup-job/form/use-backup-job-source-form.ts'
import {
  type BackupJobStorageTarget,
  type BackupJobTargetFormData,
  useBackupJobTargetForm,
} from '@/modules/backup-job/form/use-backup-job-target-form.ts'
import type { useXoBackupRepositoryCollection } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import type { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { useXoPbdCollection } from '@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'
import type { useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { useXoProxyCollection } from '@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'
import type { useXoSrCollection } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, reactive, ref } from 'vue'

vi.mock(import('@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'), () => ({
  useXoProxyCollection: (() => ({ proxies: ref([]) })) as unknown as typeof useXoProxyCollection,
}))

vi.mock(import('@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'), () => ({
  useXoBackupRepositoryCollection: (() => ({
    backupRepositories: ref([]),
    areBackupRepositoriesReady: ref(true),
  })) as unknown as typeof useXoBackupRepositoryCollection,
}))

vi.mock(import('@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'), () => ({
  useXoSrCollection: (() => ({ srs: ref([]), areSrsReady: ref(true) })) as unknown as typeof useXoSrCollection,
}))

vi.mock(import('@/modules/pool/remote-resources/use-xo-pool-collection.ts'), () => ({
  useXoPoolCollection: (() => ({ getPoolById: () => undefined })) as unknown as typeof useXoPoolCollection,
}))

vi.mock(import('@/modules/vm/remote-resources/use-xo-vm-collection.ts'), () => ({
  useXoVmCollection: (() => ({ vms: ref([]) })) as unknown as typeof useXoVmCollection,
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

function mountTargetStep(dataSource: BackupJobDataSource, storageTargets: BackupJobStorageTarget[] = []) {
  const data = reactive<BackupJobTargetFormData>({
    storageTargets,
    backupRepository: {
      targetProxy: undefined,
      backupRepositoryScopeType: 'all',
      backupRepositoryIds: [],
      backupRepositoryFilter: '',
      backupDistribution: 'every',
      exportRetention: undefined,
      ltrDailyRetention: 0,
      ltrDailyKeep: undefined,
      ltrWeeklyRetention: 0,
      ltrWeeklyKeep: undefined,
      ltrMonthlyRetention: 0,
      ltrMonthlyKeep: undefined,
      ltrYearlyRetention: 0,
      ltrYearlyKeep: undefined,
      strictGfs: false,
      mergeBackupsSynchronously: false,
    },
    storageRepository: {
      storageRepositoryScopeType: 'all',
      storageRepositoryIds: [],
      storageRepositoryFilter: '',
      replicaDistribution: 'every',
      copyRetention: undefined,
    },
    healthCheck: {
      healthCheckEnabled: false,
      healthCheckSr: undefined,
      healthCheckVmTags: [],
      healthCheckTimeout: 10,
      healthCheckSchedule: 'always',
      healthCheckMonthDays: [],
      healthCheckWeekDays: [],
      healthCheckHours: [],
    },
  })

  return mount(
    defineComponent(() => {
      const form = useBackupJobTargetForm(data, ref(dataSource), ref(undefined))

      return () => h(BackupJobTargetStep, { form })
    }),
    { global: createGlobalTestConfig() }
  )
}

function findSections(wrapper: VueWrapper) {
  return {
    storageTargets: wrapper.findComponent(BackupJobFormCheckboxGroup).exists(),
    backupRepository: wrapper.findComponent(BackupJobTargetBackupRepositorySection).exists(),
    storageRepository: wrapper.findComponent(BackupJobTargetStorageRepositorySection).exists(),
    healthCheck: wrapper.findComponent(BackupJobTargetHealthCheckSection).exists(),
  }
}

it('lets a VM backup choose its storage targets', () => {
  const wrapper = mountTargetStep('vm')

  expect(findSections(wrapper)).toEqual({
    storageTargets: true,
    backupRepository: false,
    storageRepository: false,
    healthCheck: true,
  })
  expect(wrapper.getComponent(BackupJobFormCheckboxGroup).get('.ui-label').text()).toBe(t('storage-target'))
})

it('shows a section for each storage target of a VM backup', () => {
  expect(findSections(mountTargetStep('vm', ['backup-repository', 'storage-repository']))).toEqual({
    storageTargets: true,
    backupRepository: true,
    storageRepository: true,
    healthCheck: true,
  })
})

it('stores a mirror backup on backup repositories', () => {
  expect(findSections(mountTargetStep('mirror'))).toEqual({
    storageTargets: false,
    backupRepository: true,
    storageRepository: false,
    healthCheck: true,
  })
})

it('stores a metadata backup on backup repositories, without health check', () => {
  expect(findSections(mountTargetStep('metadata'))).toEqual({
    storageTargets: false,
    backupRepository: true,
    storageRepository: false,
    healthCheck: false,
  })
})

it('offers the retention strategy of a VM backup, with the strict GFS hierarchy', () => {
  const section = mountTargetStep('vm', ['backup-repository']).getComponent(BackupJobTargetBackupRepositorySection)

  expect(section.props()).toMatchObject({ hasRetentionStrategy: true, hasStrictGfs: true })
})

it('offers the retention strategy of a mirror backup, without the strict GFS hierarchy', () => {
  const section = mountTargetStep('mirror').getComponent(BackupJobTargetBackupRepositorySection)

  expect(section.props()).toMatchObject({ hasRetentionStrategy: true, hasStrictGfs: false })
})

it('offers no retention strategy to a metadata backup', () => {
  const section = mountTargetStep('metadata').getComponent(BackupJobTargetBackupRepositorySection)

  expect(section.props()).toMatchObject({ hasRetentionStrategy: false, hasStrictGfs: false })
})
