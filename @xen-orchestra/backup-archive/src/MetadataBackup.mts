import { RemoteHandlerAbstract } from '@xen-orchestra/fs'

const METADATA_BACKUP_ID_REGEXP =
  /^xo-(config|pool-metadata)-backups\/\w{8}(-\w{4}){3}-\w{12}(\/\w{8}(-\w{4}){3}-\w{12})?\/\d{8}T\d{6}Z/

/**
 * Deletes an XO config or pool metadata backup directory (not a VM backup).
 * Shared with the legacy @xen-orchestra/backups RemoteAdapter.
 */
export async function deleteMetadataBackup(handler: RemoteHandlerAbstract, backupId: string): Promise<void> {
  if (!METADATA_BACKUP_ID_REGEXP.test(backupId)) {
    throw new Error(`The id (${backupId}) not correspond to a metadata folder`)
  }

  await handler.rmtree(backupId)
}
