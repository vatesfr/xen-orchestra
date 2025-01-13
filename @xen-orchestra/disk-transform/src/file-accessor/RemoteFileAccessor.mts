import { FileAccessor, type FileDescriptor } from './FileAccessor.mts'

export class RemoteFileAccessor extends FileAccessor {
  getSize: () => Promise<Number>
  getSizeOnDisk: () => Promise<Number>
  openFile: (path: string, opts: object) => Promise<FileDescriptor>
  closeFile: (path: string, opts: object) => Promise<void>
  read: (path: string, buffer: Buffer, offset: number) => Promise<Buffer>
  readFile: (path: string) => Promise<Buffer>
  write: (path: string, data: Buffer, offset: number) => Promise<void>
  writeFile: (path: string, data: Buffer | string) => Promise<Buffer>
  rename: (from: string, to: string) => Promise<void>
  unlink: (path: string) => Promise<void>
}
