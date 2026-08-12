import { RemoteHandlerAbstract } from '@xen-orchestra/fs'
import { promisify } from 'node:util'
import zlib from 'node:zlib'

const gzip = promisify(zlib.gzip)
const gunzip = promisify(zlib.gunzip)

type LogWarn = (message: any, opts?: object) => void

/**
 * Reads a gzip-compressed JSON cache file, tolerant of a missing or corrupt file.
 * Shared with the legacy @xen-orchestra/backups RemoteAdapter.
 */
export async function readBackupCache(
  handler: RemoteHandlerAbstract,
  path: string,
  logWarn: LogWarn
): Promise<Record<string, unknown> | undefined> {
  try {
    return JSON.parse((await gunzip(await handler.readFile(path))).toString())
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      logWarn('failed to read cache', { error, path })
    }
  }
}

/**
 * Writes data as a gzip-compressed JSON cache file.
 * Shared with the legacy @xen-orchestra/backups RemoteAdapter.
 */
export async function writeBackupCache(
  handler: RemoteHandlerAbstract,
  path: string,
  data: Record<string, unknown>,
  logWarn: LogWarn
): Promise<void> {
  try {
    await handler.writeFile(path, await gzip(JSON.stringify(data)), { flags: 'w' })
  } catch (error) {
    logWarn('failed to write cache', { error, path })
  }
}
