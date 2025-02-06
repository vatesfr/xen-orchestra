import type { Readable } from 'node:stream'

export type FileDescriptor = Number

/**
 * a base interfac is defined to be able to add other accessor ,
 * for example in browser or from a vmware datastore
 */
export interface FileAccessor {
  mktree(path: string): Promise<void>
  unlink(path: string): Promise<void>
  outputStream(stream: Readable): Promise<void>
}
