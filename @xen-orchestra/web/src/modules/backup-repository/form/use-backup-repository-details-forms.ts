import {
  type AzureBackupRepositoryDetailsFormData,
  useAzureBackupRepositoryDetailsForm,
} from '@/modules/backup-repository/form/details/use-azure-backup-repository-details-form.ts'
import {
  type LocalBackupRepositoryDetailsFormData,
  useLocalBackupRepositoryDetailsForm,
} from '@/modules/backup-repository/form/details/use-local-backup-repository-details-form.ts'
import {
  type NfsBackupRepositoryDetailsFormData,
  useNfsBackupRepositoryDetailsForm,
} from '@/modules/backup-repository/form/details/use-nfs-backup-repository-details-form.ts'
import {
  type S3BackupRepositoryDetailsFormData,
  useS3BackupRepositoryDetailsForm,
} from '@/modules/backup-repository/form/details/use-s3-backup-repository-details-form.ts'
import {
  type SmbBackupRepositoryDetailsFormData,
  useSmbBackupRepositoryDetailsForm,
} from '@/modules/backup-repository/form/details/use-smb-backup-repository-details-form.ts'
import type { BackupRepositoryGeneralFormData } from '@/modules/backup-repository/form/use-backup-repository-general-form.ts'
import { computed } from 'vue'

export type BackupRepositoryDetailsForms = ReturnType<typeof useBackupRepositoryDetailsForms>['details']

export type BackupRepositoryDetailsInitialData = {
  file?: Partial<LocalBackupRepositoryDetailsFormData>
  nfs?: Partial<NfsBackupRepositoryDetailsFormData>
  smb?: Partial<SmbBackupRepositoryDetailsFormData>
  s3?: Partial<S3BackupRepositoryDetailsFormData>
  azure?: Partial<AzureBackupRepositoryDetailsFormData>
}

export type BackupRepositoryDetailsMixedFields = {
  file?: (keyof LocalBackupRepositoryDetailsFormData)[]
  nfs?: (keyof NfsBackupRepositoryDetailsFormData)[]
  smb?: (keyof SmbBackupRepositoryDetailsFormData)[]
  s3?: (keyof S3BackupRepositoryDetailsFormData)[]
  azure?: (keyof AzureBackupRepositoryDetailsFormData)[]
}

export function useBackupRepositoryDetailsForms(
  generalFormData: BackupRepositoryGeneralFormData,
  initialData?: BackupRepositoryDetailsInitialData,
  mixedFields?: BackupRepositoryDetailsMixedFields
) {
  const details = {
    file: useLocalBackupRepositoryDetailsForm(() => generalFormData.proxy, initialData?.file, mixedFields?.file),
    nfs: useNfsBackupRepositoryDetailsForm(initialData?.nfs, mixedFields?.nfs),
    smb: useSmbBackupRepositoryDetailsForm(initialData?.smb, mixedFields?.smb),
    s3: useS3BackupRepositoryDetailsForm(initialData?.s3, mixedFields?.s3),
    azure: useAzureBackupRepositoryDetailsForm(() => generalFormData.type, initialData?.azure, mixedFields?.azure),
  }

  const currentDetailsForm = computed(() => {
    const { type } = generalFormData

    if (type === undefined) {
      return undefined
    }

    return details[type === 'azurite' ? 'azure' : type]
  })

  return { details, currentDetailsForm }
}
