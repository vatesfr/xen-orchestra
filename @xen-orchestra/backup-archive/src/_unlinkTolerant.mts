import { RemoteHandlerAbstract } from '@xen-orchestra/fs'

/**
 * Deletes a file, ignoring the given error codes.
 * By default only a missing file is tolerated.
 */
export async function unlinkTolerant(
  handler: RemoteHandlerAbstract,
  path: string,
  ignoredCodes: string[] = ['ENOENT']
): Promise<void> {
  try {
    await handler.unlink(path)
  } catch (error) {
    if (!ignoredCodes.includes(error?.code)) {
      error.path ??= path
      throw error
    }
  }
}
