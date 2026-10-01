import { useXoBackupRepositoryParsedUrl } from '@/modules/backup-repository/composables/use-xo-backup-repository-parsed-url.composable.ts'
import { useBackupRepositoryDetailsForms } from '@/modules/backup-repository/form/use-backup-repository-details-forms.ts'
import {
  type BackupRepositoryGeneralFormData,
  useBackupRepositoryGeneralForm,
} from '@/modules/backup-repository/form/use-backup-repository-general-form.ts'
import type { EditBackupRepositoryPayload } from '@/modules/backup-repository/jobs/xo-backup-repository-edit.job.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { getBackupRepositoryDetailsInitialData } from '@/modules/backup-repository/utils/xo-backup-repository.util.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { type MaybeRefOrGetter, reactive } from 'vue'
import { format as formatBackupRepositoryUrl } from 'xo-remote-parser'

export function useEditBackupRepositoryForm(rawBr: MaybeRefOrGetter<FrontXoBackupRepository>) {
  const br = toComputed(rawBr)

  const parsedUrl = useXoBackupRepositoryParsedUrl(br)

  const general = useBackupRepositoryGeneralForm(
    reactive<BackupRepositoryGeneralFormData>({
      name: br.value.name,
      type: parsedUrl.value?.type,
      backupFormat: parsedUrl.value?.useVhdDirectory ? 'block' : 'vhd',
      proxy: br.value.proxy,
      encrypted: parsedUrl.value?.encryptionKey !== undefined,
      encryptionKey: parsedUrl.value?.encryptionKey ?? '',
    }),
    true
  )

  const { details, currentDetailsForm } = useBackupRepositoryDetailsForms(
    general.formData,
    parsedUrl.value === undefined ? undefined : getBackupRepositoryDetailsInitialData(parsedUrl.value, br.value.options)
  )

  async function validateAndBuildPayload(): Promise<EditBackupRepositoryPayload | undefined> {
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
      name: general.formData.name,
      url: formatBackupRepositoryUrl({ ...urlInfo, ...general.buildUrlOptions() }),
      options: options ?? null,
      proxy: general.formData.proxy ?? null,
    }
  }

  return {
    general,
    details,
    validateAndBuildPayload,
  }
}
