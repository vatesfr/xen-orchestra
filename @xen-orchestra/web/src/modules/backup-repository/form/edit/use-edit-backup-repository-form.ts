import { useBackupRepositoryFormBase } from '@/modules/backup-repository/form/use-backup-repository-form-base.ts'
import type { BackupRepositoryGeneralFormData } from '@/modules/backup-repository/form/use-backup-repository-general-form.ts'
import type { EditBackupRepositoryPayload } from '@/modules/backup-repository/jobs/xo-backup-repository-edit.job.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { getBackupRepositoryDetailsInitialData } from '@/modules/backup-repository/utils/xo-backup-repository-details-initial-data.util.ts'
import { isBackupRepositoryEncrypted } from '@/modules/backup-repository/utils/xo-backup-repository.util.ts'
import { reactive } from 'vue'
import { parse as parseBackupRepositoryUrl } from 'xo-remote-parser'

export function useEditBackupRepositoryForm(br: FrontXoBackupRepository) {
  const parsedUrl = parseBackupRepositoryUrl(br.url)

  const {
    general,
    details,
    detailsTitle,
    validateAndBuildPayload: validateAndBuildBasePayload,
  } = useBackupRepositoryFormBase(
    reactive<BackupRepositoryGeneralFormData>({
      name: br.name,
      type: parsedUrl.type,
      backupFormat: parsedUrl.useVhdDirectory ? 'block' : 'vhd',
      proxy: br.proxy,
      encrypted: isBackupRepositoryEncrypted(parsedUrl),
      encryptionKey: parsedUrl.encryptionKey ?? '',
    }),
    {
      isEditing: true,
      detailsInitialData: getBackupRepositoryDetailsInitialData(parsedUrl, br.options),
      // no field of this form sets it: without this, editing the repository drops it, and the VM backups
      // cache rebuilds the repository with the default listing interval
      urlOptionsToKeep: { fullListingInterval: parsedUrl.fullListingInterval },
    }
  )

  async function validateAndBuildPayload(): Promise<EditBackupRepositoryPayload | undefined> {
    const payload = await validateAndBuildBasePayload()

    if (payload === undefined) {
      return undefined
    }

    return {
      ...payload,
      options: payload.options ?? null,
      proxy: payload.proxy ?? null,
    }
  }

  return {
    general,
    details,
    detailsTitle,
    validateAndBuildPayload,
  }
}
