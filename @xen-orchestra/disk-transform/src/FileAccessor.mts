import type { Readable } from 'node:stream'

/** A file descriptor as returned by openFile() - implementation-defined (e.g. a number on local fs) */
export interface FileArg {
  fd: unknown
  path: string
}
export type FileDescriptor = number | string | FileArg

/**
 * a base interface is defined to be able to add other accessor ,
 * for example in browser or from a vmware datastore
 *
 * NOTE : file accessor on datastore should try to use a stream
 * and read/skip from this when possible, since opening a new stream is costly
 * and we are generally reading the vhd sequentially
 */
export interface FileAccessor {
  isEncrypted: boolean
  list(path: string, opts?: unknown): Promise<string[]>
  closeFile(filehandle: FileDescriptor): Promise<void>
  openFile(path: string, opts?: unknown): Promise<FileDescriptor>
  read(
    file: FileDescriptor,
    buffer: Buffer | DataView,
    position: number
  ): Promise<{ bytesRead: number; buffer: Buffer | DataView }>
  readFile(path: string): Promise<string>
  writeFile(path: string, content: string, opts?: unknown): Promise<void>
  getSize(path: string): Promise<number>
  mktree(path: string): Promise<void>
  rmtree(path: string): Promise<void>
  unlink(path: string): Promise<void>
  outputStream(path: string, input: Readable, opts?: unknown): Promise<void>
  rename(path: string, newPath: string): Promise<void>
}
