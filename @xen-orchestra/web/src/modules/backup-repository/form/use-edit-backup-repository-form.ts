import { useXoBackupRepositoryParsedUrl } from '@/modules/backup-repository/composables/use-xo-backup-repository-parsed-url.composable.ts'
import { useBackupRepositoryDetailsForms } from '@/modules/backup-repository/form/use-backup-repository-details-forms.ts'
import {
  type BackupRepositoryGeneralFormData,
  useBackupRepositoryGeneralForm,
} from '@/modules/backup-repository/form/use-backup-repository-general-form.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { type MaybeRefOrGetter, reactive } from 'vue'

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
    })
  )

  const { details, currentDetailsForm } = useBackupRepositoryDetailsForms(general.formData)

  async function validate(): Promise<boolean> {
    const [isGeneralValid, areDetailsValid] = await Promise.all([
      general.validate(),
      currentDetailsForm.value?.validate() ?? false,
    ])

    return isGeneralValid && areDetailsValid
  }

  return {
    general,
    details,
    validate,
  }
}
