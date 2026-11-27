import {
  type BackupJobTargetBackupRepositoryFormData,
  useBackupJobTargetBackupRepositoryForm,
} from '@/modules/backup-job/form/target/use-backup-job-target-backup-repository-form.ts'
import {
  type BackupJobTargetHealthCheckFormData,
  useBackupJobTargetHealthCheckForm,
} from '@/modules/backup-job/form/target/use-backup-job-target-health-check-form.ts'
import {
  type BackupJobTargetStorageRepositoryFormData,
  useBackupJobTargetStorageRepositoryForm,
} from '@/modules/backup-job/form/target/use-backup-job-target-storage-repository-form.ts'
import type { BackupJobDataSource } from '@/modules/backup-job/form/use-backup-job-source-form.ts'
import type { BackupJobFormOption } from '@/modules/backup-job/types/backup-job-form.type.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import type { FrontXoProxy } from '@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'
import { requiredIf, withMessage } from '@core/packages/form-validation'
import { useValidatedForm } from '@core/packages/validated-form'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter, reactive } from 'vue'
import { useI18n } from 'vue-i18n'

export type BackupJobStorageTarget = 'backup-repository' | 'storage-repository'

export type BackupJobTargetFormData = {
  storageTargets: BackupJobStorageTarget[]
  backupRepository: BackupJobTargetBackupRepositoryFormData
  storageRepository: BackupJobTargetStorageRepositoryFormData
  healthCheck: BackupJobTargetHealthCheckFormData
}

export type BackupJobTargetForm = ReturnType<typeof useBackupJobTargetForm>

export function useBackupJobTargetForm(
  formData: BackupJobTargetFormData,
  rawDataSource: MaybeRefOrGetter<BackupJobDataSource>,
  rawSourceBackupRepositoryId: MaybeRefOrGetter<FrontXoBackupRepository['id'] | undefined>,
  rawSourceProxy: MaybeRefOrGetter<FrontXoProxy['id'] | undefined>,
  { isEditing = false }: { isEditing?: boolean } = {}
) {
  const { t } = useI18n()

  const dataSource = toComputed(rawDataSource)

  const sourceProxy = toComputed(rawSourceProxy)

  const hasStorageTargetChoice = computed(() => dataSource.value === 'vm')

  const hasBackupRepositorySection = computed(
    () => dataSource.value !== 'vm' || formData.storageTargets.includes('backup-repository')
  )

  const hasRetentionStrategy = computed(() => hasBackupRepositorySection.value && dataSource.value !== 'metadata')

  const hasStrictGfs = computed(() => hasRetentionStrategy.value && dataSource.value !== 'mirror')

  const hasTargetProxy = computed(() => dataSource.value !== 'mirror')

  const backupRepositoryProxy = computed(() =>
    hasTargetProxy.value ? formData.backupRepository.targetProxy : sourceProxy.value
  )

  const hasHealthCheckSection = computed(() => dataSource.value !== 'metadata')

  const hasStorageRepositorySection = computed(
    () => dataSource.value === 'vm' && formData.storageTargets.includes('storage-repository')
  )

  const backupRepository = useBackupJobTargetBackupRepositoryForm(
    formData.backupRepository,
    hasBackupRepositorySection,
    hasRetentionStrategy,
    rawSourceBackupRepositoryId,
    backupRepositoryProxy,
    { isEditing }
  )

  const storageRepository = useBackupJobTargetStorageRepositoryForm(
    formData.storageRepository,
    hasStorageRepositorySection
  )

  const healthCheck = useBackupJobTargetHealthCheckForm(formData.healthCheck, hasHealthCheckSection)

  const {
    useField,
    validate: validateStorageTargets,
    reset: resetStorageTargets,
  } = useValidatedForm(formData, {
    errors: {
      onSubmit: () => ({
        storageTargets: {
          requiredIf: withMessage(
            requiredIf(() => hasStorageTargetChoice.value),
            () => t('select-at-least-one-storage-target')
          ),
        },
      }),
    },
  })

  const storageTargetLabels = computed<Record<BackupJobStorageTarget, string>>(() => ({
    'backup-repository': t('backup-repository'),
    'storage-repository': t('storage-repository'),
  }))

  function getStorageTargetLabel(storageTarget: BackupJobStorageTarget): string {
    return storageTargetLabels.value[storageTarget]
  }

  const storageTargetOptions = computed<BackupJobFormOption<BackupJobStorageTarget>[]>(() => [
    { label: storageTargetLabels.value['backup-repository'], value: 'backup-repository' },
    { label: storageTargetLabels.value['storage-repository'], value: 'storage-repository' },
  ])

  const bindings = reactive({
    storageTargets: useField('storageTargets', () => ({
      label: t('storage-target'),
      options: storageTargetOptions.value,
    })),
  })

  async function validate(): Promise<boolean> {
    const results = await Promise.all([
      validateStorageTargets(),
      backupRepository.validate(),
      storageRepository.validate(),
      healthCheck.validate(),
    ])

    return results.every(isValid => isValid)
  }

  function reset() {
    resetStorageTargets()
    backupRepository.reset()
    storageRepository.reset()
    healthCheck.reset()
  }

  return {
    formData,
    bindings,
    backupRepository,
    storageRepository,
    healthCheck,
    hasStorageTargetChoice,
    hasBackupRepositorySection,
    hasRetentionStrategy,
    hasStrictGfs,
    hasTargetProxy,
    hasHealthCheckSection,
    hasStorageRepositorySection,
    getStorageTargetLabel,
    validate,
    reset,
  }
}
