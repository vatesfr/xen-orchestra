import { asyncMapSettled } from '@xen-orchestra/async-map'
import { RemoteHandlerAbstract } from '@xen-orchestra/fs'

// XO config / pool metadata backups live in a directory tree separate from VM backups
// (xo-config-backups / xo-pool-metadata-backups). These helpers operate on that tree.

export async function deleteMetadataBackup(handler: RemoteHandlerAbstract, backupId: string): Promise<void> {
  const uuidReg = '\\w{8}(-\\w{4}){3}-\\w{12}'
  const metadataDirReg = 'xo-(config|pool-metadata)-backups'
  const timestampReg = '\\d{8}T\\d{6}Z'
  const regexp = new RegExp(`^${metadataDirReg}/${uuidReg}(/${uuidReg})?/${timestampReg}`)
  if (!regexp.test(backupId)) {
    throw new Error(`The id (${backupId}) not correspond to a metadata folder`)
  }

  await handler.rmtree(backupId)
}

export async function deleteOldMetadataBackups(
  handler: RemoteHandlerAbstract,
  dir: string,
  retention: number
): Promise<void> {
  let list: string[] = await handler.list(dir)
  list.sort()
  // NOTE: `slice(0, -0)` is `slice(0, 0)`, so a retention of 0 deletes nothing. That is
  // intentional: throughout XO a metadata retention of 0 means "this mode is disabled"
  // (see DEFAULT_METADATA_SETTINGS and the `!== 0` guards in _runners/Metadata.mjs), never
  // "keep no backup". Deleting the whole directory on 0 would turn the default value into
  // data loss.
  list = list.filter((timestamp: string) => /^\d{8}T\d{6}Z$/.test(timestamp)).slice(0, -retention)
  await asyncMapSettled(list, (timestamp: string) => handler.rmtree(`${dir}/${timestamp}`))
}
