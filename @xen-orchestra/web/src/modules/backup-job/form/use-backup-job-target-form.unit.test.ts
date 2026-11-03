import type { BackupJobTargetBackupRepositoryFormData } from '@/modules/backup-job/form/target/use-backup-job-target-backup-repository-form.ts'
import type { BackupJobDataSource } from '@/modules/backup-job/form/use-backup-job-source-form.ts'
import {
  type BackupJobTargetFormData,
  useBackupJobTargetForm,
} from '@/modules/backup-job/form/use-backup-job-target-form.ts'
import type { useXoBackupRepositoryCollection } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import type { useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { useXoProxyCollection } from '@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'
import type { useXoSrCollection } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'

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

function createTargetFormData(): BackupJobTargetFormData {
  return {
    storageTargets: ['backup-repository'],
    backupRepository: {
      targetProxy: undefined,
      backupRepositoryScopeType: 'all',
      backupRepositoryIds: [],
      backupRepositoryFilter: '',
      backupDistribution: 'every',
      exportRetention: 3,
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
  }
}

function mountTargetForm(
  dataSource: BackupJobDataSource,
  {
    storageTargets,
    backupRepository,
  }: Partial<Pick<BackupJobTargetFormData, 'storageTargets'>> & {
    backupRepository?: Partial<BackupJobTargetBackupRepositoryFormData>
  } = {}
) {
  const formData = createTargetFormData()

  return mountComposable(() => {
    const { t } = useI18n()

    return {
      ...useBackupJobTargetForm(
        reactive({
          ...formData,
          storageTargets: storageTargets ?? formData.storageTargets,
          backupRepository: { ...formData.backupRepository, ...backupRepository },
        }),
        ref(dataSource),
        ref(undefined)
      ),
      t,
    }
  }).wrapper.vm
}

function getSections(form: ReturnType<typeof mountTargetForm>) {
  return {
    hasStorageTargetChoice: form.hasStorageTargetChoice,
    hasBackupRepositorySection: form.hasBackupRepositorySection,
    hasRetentionStrategy: form.hasRetentionStrategy,
    hasStrictGfs: form.hasStrictGfs,
    hasStorageRepositorySection: form.hasStorageRepositorySection,
    hasHealthCheckSection: form.hasHealthCheckSection,
  }
}

describe('sections', () => {
  it('lets a VM backup store on backup repositories, with every retention option', () => {
    expect(getSections(mountTargetForm('vm'))).toEqual({
      hasStorageTargetChoice: true,
      hasBackupRepositorySection: true,
      hasRetentionStrategy: true,
      hasStrictGfs: true,
      hasStorageRepositorySection: false,
      hasHealthCheckSection: true,
    })
  })

  it('lets a VM backup replicate on storage repositories only', () => {
    expect(getSections(mountTargetForm('vm', { storageTargets: ['storage-repository'] }))).toEqual({
      hasStorageTargetChoice: true,
      hasBackupRepositorySection: false,
      hasRetentionStrategy: false,
      hasStrictGfs: false,
      hasStorageRepositorySection: true,
      hasHealthCheckSection: true,
    })
  })

  it('stores a mirror backup on backup repositories, without strict GFS hierarchy', () => {
    expect(getSections(mountTargetForm('mirror', { storageTargets: [] }))).toEqual({
      hasStorageTargetChoice: false,
      hasBackupRepositorySection: true,
      hasRetentionStrategy: true,
      hasStrictGfs: false,
      hasStorageRepositorySection: false,
      hasHealthCheckSection: true,
    })
  })

  it('stores a metadata backup on backup repositories, without retention strategy nor health check', () => {
    expect(getSections(mountTargetForm('metadata', { storageTargets: [] }))).toEqual({
      hasStorageTargetChoice: false,
      hasBackupRepositorySection: true,
      hasRetentionStrategy: false,
      hasStrictGfs: false,
      hasStorageRepositorySection: false,
      hasHealthCheckSection: false,
    })
  })
})

describe('validate', () => {
  it('accepts a VM backup on every backup repository', async () => {
    const form = mountTargetForm('vm')

    expect(await form.validate()).toBe(true)
  })

  it('requires a storage target for a VM backup', async () => {
    const form = mountTargetForm('vm', { storageTargets: [] })

    expect(await form.validate()).toBe(false)
    expect(form.bindings.storageTargets.error).toMatchObject({
      content: form.t('select-at-least-one-storage-target'),
    })
  })

  it('validates the backup repository section', async () => {
    const form = mountTargetForm('mirror', { backupRepository: { exportRetention: undefined } })

    expect(await form.validate()).toBe(false)
  })
})

describe('getStorageTargetLabel', () => {
  it('labels the storage target', () => {
    const form = mountTargetForm('vm')

    expect(form.getStorageTargetLabel('storage-repository')).toBe(form.t('storage-repository'))
  })
})
