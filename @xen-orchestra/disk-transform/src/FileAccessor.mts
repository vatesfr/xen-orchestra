import type { Readable } from 'node:stream'

export type FileDescriptor = number

/**
 * a base interface is defined to be able to add other accessor ,
 * for example in browser or from a vmware datastore
 *
 * NOTE : file accessor on datastore should try to use a stream
 * and read/skip from this when possible, since opening a new stream is costly
 * and we are generally reading the vhd sequentially
 */
export interface FileAccessor {
  closeFile(filehandle: number): Promise<void>
  openFile(path: string, opts?: unknown): Promise<number>
  read(
    file: string | number,
    buffer: Buffer | DataView,
    position: number
  ): Promise<{ bytesRead: number; buffer: Buffer | DataView }>
  getSize(path: string): Promise<number>
  mktree(path: string): Promise<void>
  rmtree(path: string): Promise<void>
  unlink(path: string): Promise<void>
  outputStream(stream: Readable): Promise<void>
}
