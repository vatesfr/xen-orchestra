import { useXoBackupRepositoryTypeLabel } from '@/modules/backup-repository/composables/use-xo-backup-repository-type-label.composable.ts'
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
import {
  type BackupRepositoryGeneralFormData,
  type BackupRepositoryGeneralFormOptions,
  useBackupRepositoryGeneralForm,
} from '@/modules/backup-repository/form/use-backup-repository-general-form.ts'
import type { FrontXoProxy } from '@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { format as formatBackupRepositoryUrl } from 'xo-remote-parser'

export type BackupRepositoryPayload = {
  name: string
  url: string
  options?: string
  proxy?: FrontXoProxy['id']
}

export type BackupRepositoryDetailsForms = ReturnType<typeof useBackupRepositoryFormBase>['details']

export type BackupRepositoryDetailsInitialData = {
  file?: Partial<LocalBackupRepositoryDetailsFormData>
  nfs?: Partial<NfsBackupRepositoryDetailsFormData>
  smb?: Partial<SmbBackupRepositoryDetailsFormData>
  s3?: Partial<S3BackupRepositoryDetailsFormData>
  azure?: Partial<AzureBackupRepositoryDetailsFormData>
}

export function useBackupRepositoryFormBase(
  generalFormData: BackupRepositoryGeneralFormData,
  options: BackupRepositoryGeneralFormOptions & { detailsInitialData?: BackupRepositoryDetailsInitialData } = {}
) {
  const { t } = useI18n()

  const { detailsInitialData, ...generalFormOptions } = options

  const general = useBackupRepositoryGeneralForm(generalFormData, generalFormOptions)

  const details = {
    file: useLocalBackupRepositoryDetailsForm(() => generalFormData.proxy, detailsInitialData?.file),
    nfs: useNfsBackupRepositoryDetailsForm(detailsInitialData?.nfs),
    smb: useSmbBackupRepositoryDetailsForm(detailsInitialData?.smb),
    s3: useS3BackupRepositoryDetailsForm(detailsInitialData?.s3),
    azure: useAzureBackupRepositoryDetailsForm(() => generalFormData.type, detailsInitialData?.azure),
  }

  const currentDetailsForm = computed(() => {
    const { type } = generalFormData

    if (type === undefined) {
      return undefined
    }

    return details[type === 'azurite' ? 'azure' : type]
  })

  const typeLabel = useXoBackupRepositoryTypeLabel(() => generalFormData.type)

  const detailsTitle = computed(() =>
    generalFormData.type === undefined ? '' : t('br-type-details', { type: typeLabel.value })
  )

  async function validateAndBuildPayload(): Promise<BackupRepositoryPayload | undefined> {
    const detailsForm = currentDetailsForm.value

    if (detailsForm === undefined) {
      return undefined
    }

    const [isGeneralValid, areDetailsValid] = await Promise.all([general.validate(), detailsForm.validate()])

    if (!isGeneralValid || !areDetailsValid) {
      return undefined
    }

    const { urlInfo, options } = detailsForm.buildPayload()

    return {
      name: generalFormData.name,
      url: formatBackupRepositoryUrl({ ...urlInfo, ...general.buildUrlOptions() }),
      ...(options !== undefined && { options }),
      ...(generalFormData.proxy !== undefined && { proxy: generalFormData.proxy }),
    }
  }

  return { general, details, currentDetailsForm, detailsTitle, validateAndBuildPayload }
}
