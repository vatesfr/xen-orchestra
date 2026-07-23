import { RemoteHandlerAbstract } from '@xen-orchestra/fs'
import { asyncMapSettled } from '@xen-orchestra/async-map'

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
  list = list.filter((timestamp: string) => /^\d{8}T\d{6}Z$/.test(timestamp)).slice(0, -retention)
  await (asyncMapSettled as any)(list, (timestamp: string) => handler.rmtree(`${dir}/${timestamp}`))
}
