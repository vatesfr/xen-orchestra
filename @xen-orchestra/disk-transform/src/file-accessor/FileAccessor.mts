export type FileDescriptor = Number

export abstract class FileAccessor {
  abstract getSize: () => Promise<Number>
  abstract getSizeOnDisk: () => Promise<Number>
  abstract openFile: (path: string, opts: object) => Promise<FileDescriptor>
  abstract closeFile: (path: string, opts: object) => Promise<void>
  abstract read: (path: string, buffer: Buffer, offset: number) => Promise<Buffer>
  abstract readFile: (path: string) => Promise<Buffer>
  abstract write: (path: string, data: Buffer, offset: number) => Promise<void>
  abstract writeFile: (path: string, data: Buffer | string) => Promise<Buffer>
  abstract rename: (from: string, to: string) => Promise<void>
  abstract unlink: (path: string) => Promise<void>
}
