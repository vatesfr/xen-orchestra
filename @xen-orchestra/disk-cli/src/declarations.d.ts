declare module 'promise-toolbox/Disposable' {
  interface DisposableLike<T> {
    value: T
    dispose(): void | Promise<void>
  }

  const Disposable: {
    use<T, R>(
      disposable: DisposableLike<T> | PromiseLike<DisposableLike<T>>,
      fn: (value: T) => R | Promise<R>
    ): Promise<R>
  }

  export default Disposable
}

declare module '@xen-orchestra/fs' {
  export interface RemoteHandler {
    list(dir: string, opts?: { prependDir?: boolean }): Promise<string[]>
    [key: string]: unknown
  }

  export interface HandlerDisposable {
    value: RemoteHandler
    dispose: () => Promise<void>
  }

  export function getSyncedHandler(remote: { url: string }): Promise<HandlerDisposable>
}

declare module 'vhd-lib/disk-consumer/index.mjs' {
  import type { Readable } from 'node:stream'
  import type { RandomAccessDisk } from '@xen-orchestra/disk-transform'
  export function toVhdStream(disk: RandomAccessDisk): Promise<Readable>
}

declare module '@xen-orchestra/backups/disks/openDiskChain.mjs' {
  import type { RemoteHandler } from '@xen-orchestra/fs'
  import type { RandomAccessDisk } from '@xen-orchestra/disk-transform'

  export function openDiskChain(params: {
    handler: RemoteHandler
    path: string
    until?: string
  }): Promise<RandomAccessDisk>
}

declare module '@xen-orchestra/backups/disks' {
  import type { RemoteHandler } from '@xen-orchestra/fs'
  import type { RandomAccessDisk } from '@xen-orchestra/disk-transform'

  export interface RemoteDisk extends RandomAccessDisk {
    getSizeOnDisk(): number
    getPath(): string
    getUuid(): string
    getParentUuid(): string
    getMaxBlockCount(): number
  }

  export interface DiskDisposable {
    value: RemoteDisk
    dispose: () => Promise<void>
  }

  export function isDisk(handler: RemoteHandler, path: string): boolean

  export function openDisposableDisk(params: { handler: RemoteHandler; path: string }): Promise<DiskDisposable>

  export function openDiskChain(params: {
    handler: RemoteHandler
    path: string
    until?: string
  }): Promise<RandomAccessDisk>
}
