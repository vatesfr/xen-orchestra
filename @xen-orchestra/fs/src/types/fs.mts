import type { Readable, Writable } from 'stream'

// ─── Supporting types ────────────────────────────────────────────────────────

export interface RemoteInfo {
  url: string
  encryptionKey?: string
  immutable?: boolean
  useVhdDirectory?: boolean
  [key: string]: unknown
}

/** A file descriptor as returned by openFile() */
export interface FileDescriptor {
  fd: unknown // implementation-defined (e.g. number on local fs)
  path: string
}

/** A file argument: either a path string or an open FileDescriptor */
export type FileArg = string | FileDescriptor

export interface RemoteHandlerOptions {
  highWaterMark?: number
  timeout?: number
  maxParallelOperations?: number
  withLimit?: string[]
  withTimeout?: string[]
  withRetry?: Record<string, RetryOptions>
}

export interface RetryOptions {
  updateArguments?: (error: Error, args: unknown[]) => unknown[]
}

export interface RemoteInfoResult {
  size?: number
  used?: number
  available?: number
  [key: string]: unknown
}

export interface ListOptions {
  filter?: (entry: string) => boolean
  ignoreMissing?: boolean
  prependDir?: boolean
}

export interface ReadStreamOptions {
  checksum?: boolean
  ignoreMissingChecksum?: boolean
  start?: number
  end?: number
  highWaterMark?: number
  flags?: string
  [key: string]: unknown
}

export interface OutputStreamOptions {
  checksum?: boolean
  dirMode?: number
  maxStreamLength?: number
  streamLength?: number
  validator?: (this: RemoteHandlerAbstract, path: string) => Promise<void>
}

export interface OutputFileOptions {
  dirMode?: number
  flags?: string
}

export interface ReadFileOptions {
  flags?: string
}

export interface WriteFileOptions {
  flags?: string
  dirMode?: number
}

export interface MkdirOptions {
  mode?: number
}

export interface RenameOptions {
  checksum?: boolean
}

export interface CopyOptions {
  checksum?: boolean
}

export interface UnlinkOptions {
  checksum?: boolean
}

export interface ReadResult {
  buffer: Buffer
  bytesRead: number
}

export interface TestResult {
  success: boolean
  writeRate?: number
  readRate?: number
  step?: string
  file?: string
  error?: Error
}

export interface LockDisposer {
  dispose: () => Promise<void>
}

// ─── Abstract base class ─────────────────────────────────────────────────────

export default abstract class RemoteHandlerAbstract {
  constructor(_remote: RemoteInfo, _options?: RemoteHandlerOptions) {}
  abstract get type(): string
  abstract get isEncrypted(): boolean
  abstract get encryptionAlgorithm(): string
  abstract sync(): Promise<void>
  abstract forget(): Promise<void>
  abstract list(dir: string, options?: ListOptions): Promise<string[]>
  abstract mkdir(dir: string, options?: MkdirOptions): Promise<void>
  abstract mktree(dir: string, options?: MkdirOptions): Promise<void>
  abstract rmdir(dir: string): Promise<void>
  abstract rmtree(dir: string): Promise<void>
  abstract createReadStream(
    file: FileArg,
    options?: ReadStreamOptions
  ): Promise<Readable & { length?: number; maxStreamLength?: number }>

  abstract readFile(file: string, options?: ReadFileOptions): Promise<Buffer>

  abstract read(file: FileArg, buffer: Buffer, position?: number): Promise<ReadResult>

  abstract outputStream(path: string, input: Readable, options?: OutputStreamOptions): Promise<void>
  abstract outputFile(file: string, data: string | Buffer, options?: OutputFileOptions): Promise<void>
  abstract writeFile(file: string, data: string | Buffer, options?: WriteFileOptions): Promise<void>

  abstract write(file: FileArg, buffer: Buffer, position?: number): Promise<void>
  abstract truncate(file: string, len: number): Promise<void>

  // ── File management ──────────────────────────────────────────────────────

  abstract rename(oldPath: string, newPath: string, options?: RenameOptions): Promise<void>
  abstract copy(oldPath: string, newPath: string, options?: CopyOptions): Promise<void>

  /** Silently ignores ENOENT. By default also removes the associated checksum file. */
  abstract unlink(file: string, options?: UnlinkOptions): Promise<void>

  // ── File descriptor operations ───────────────────────────────────────────

  abstract openFile(path: string, flags: string): Promise<FileDescriptor>
  abstract closeFile(fd: FileDescriptor): Promise<void>

  abstract getInfo(): Promise<RemoteInfoResult>

  abstract getSize(file: FileArg): Promise<number>
  abstract getSizeOnDisk(file: FileArg): Promise<number>
  abstract lock(path: string): Promise<LockDisposer>
  abstract test(): Promise<TestResult>
  abstract isImmutable(): boolean
  abstract useVhdDirectory(): boolean
  abstract addPrefix(prefix: string): RemoteHandlerAbstract
}
