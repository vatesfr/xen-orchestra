import { useAzureBackupRepositoryDetailsForm } from '@/modules/backup-repository/form/details/use-azure-backup-repository-details-form.ts'
import { useLocalBackupRepositoryDetailsForm } from '@/modules/backup-repository/form/details/use-local-backup-repository-details-form.ts'
import { useNfsBackupRepositoryDetailsForm } from '@/modules/backup-repository/form/details/use-nfs-backup-repository-details-form.ts'
import { useS3BackupRepositoryDetailsForm } from '@/modules/backup-repository/form/details/use-s3-backup-repository-details-form.ts'
import { useSmbBackupRepositoryDetailsForm } from '@/modules/backup-repository/form/details/use-smb-backup-repository-details-form.ts'
import type { BackupRepositoryGeneralFormData } from '@/modules/backup-repository/form/use-backup-repository-general-form.ts'
import { computed } from 'vue'

export type BackupRepositoryDetailsForms = ReturnType<typeof useBackupRepositoryDetailsForms>['details']

export function useBackupRepositoryDetailsForms(generalFormData: BackupRepositoryGeneralFormData) {
  const details = {
    file: useLocalBackupRepositoryDetailsForm(() => generalFormData.proxy),
    nfs: useNfsBackupRepositoryDetailsForm(),
    smb: useSmbBackupRepositoryDetailsForm(),
    s3: useS3BackupRepositoryDetailsForm(),
    azure: useAzureBackupRepositoryDetailsForm(() => generalFormData.type),
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
