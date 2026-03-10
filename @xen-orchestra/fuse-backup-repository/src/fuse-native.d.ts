declare module 'fuse-native' {
  interface FuseHandlers {
    readdir?(path: string, cb: (code: number, entries?: string[]) => void): void
    getattr?(path: string, cb: (code: number, stat?: object) => void): void
    open?(path: string, flags: number, cb: (code: number, fd?: number) => void): void
    create?(path: string, mode: number, cb: (code: number, fd?: number) => void): void
    release?(path: string, fd: number, cb: (code: number) => void): void
    read?(path: string, fd: number, buf: Buffer, len: number, pos: number, cb: (bytesRead: number) => void): void
    write?(path: string, fd: number, buf: Buffer, len: number, pos: number, cb: (bytesWritten: number) => void): void
    truncate?(path: string, size: number, cb: (code: number) => void): void
    ftruncate?(path: string, fd: number, size: number, cb: (code: number) => void): void
    unlink?(path: string, cb: (code: number) => void): void
  }

  interface FuseOptions {
    debug?: boolean
    force?: boolean
    mkdir?: boolean
  }

  class Fuse {
    static ENOENT: number
    static EACCES: number
    static EISDIR: number
    static ENOTDIR: number
    static ENOTEMPTY: number
    static EPERM: number
    static EIO: number
    static EEXIST: number

    constructor(mountPoint: string, handlers: FuseHandlers, options?: FuseOptions)
    mount(cb: (err: Error | null) => void): void
    unmount(cb: (err: Error | null) => void): void
  }

  export = Fuse
}
