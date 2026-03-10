import Fuse from 'fuse-native'
import * as nodefs from 'node:fs'
import * as nodepath from 'node:path'
import { promisify } from 'node:util'
import type { RawConsumer } from '@xen-orchestra/disk-transform'

export type { RawConsumer }

// Stat helper matching fuse-native expectations
// dir mode  = 0o40755 = 16877
// file mode = 0o100644 = 33188
const makeStat = (mode: 'dir' | 'file', size: number) => ({
  mtime: new Date(),
  atime: new Date(),
  ctime: new Date(),
  size,
  mode: mode === 'dir' ? 16877 : 33188,
  uid: process.getuid?.() ?? 0,
  gid: process.getgid?.() ?? 0,
})

const fsOpen = promisify(nodefs.open)
const fsClose = promisify(nodefs.close)
const fsRead = promisify(nodefs.read)
const fsWrite = promisify(nodefs.write)
const fsStat = promisify(nodefs.stat)
const fsTruncate = promisify(nodefs.truncate)
const fsFtruncate = promisify(nodefs.ftruncate)
const fsUnlink = promisify(nodefs.unlink)
const fsReaddir = promisify(nodefs.readdir)

export class LiveBackupRepository {
  readonly #mountPoint: string
  readonly #cachePath: string
  readonly #disks = new Map<string, RawConsumer>()
  #fuse: Fuse | undefined

  constructor(mountPoint: string, cachePath: string) {
    this.#mountPoint = mountPoint
    this.#cachePath = cachePath
  }

  /**
   * Register a disk to be exposed as a read-only file in the mounted SR.
   * The filename will be "<disk.uuid>.vhd".
   */
  addDisk(disk: RawConsumer): void {
    this.#disks.set(disk.uuid + '.qcow2', disk)
  }

  /**
   * Initialise all registered disks then mount the FUSE filesystem.
   */
  async init(): Promise<void> {
    await nodefs.promises.mkdir(this.#cachePath, { recursive: true })
    await Promise.all([...this.#disks.values()].map(d => d.init()))

    const disks = this.#disks
    const cachePath = this.#cachePath

    // fuse fd → real OS fd for cache files; null marks a disk (no real fd needed)
    let nextFuseFd = 1
    const openFds = new Map<number, number | null>()

    const cacheFilePath = (name: string) => nodepath.join(cachePath, name)

    const fuse = new Fuse(
      this.#mountPoint,
      {
        async readdir(path, cb) {
          if (path !== '/') return cb(Fuse.ENOENT)
          const names = [...disks.keys()]
          try {
            const cacheFiles = (await fsReaddir(cachePath)) as string[]
            for (const f of cacheFiles) {
              if (!disks.has(f)) names.push(f)
            }
          } catch {
            // cachePath might be empty or unreadable — ignore
          }
          cb(0, names)
        },

        async getattr(path, cb) {
          if (path === '/') return cb(0, makeStat('dir', 4096))
          const name = path.slice(1)

          const disk = disks.get(name)
          if (disk !== undefined) {
            return cb(0, makeStat('file', disk.size()))
          }

          try {
            const st = await fsStat(cacheFilePath(name))
            cb(0, {
              mtime: st.mtime,
              atime: st.atime,
              ctime: st.ctime,
              size: st.size,
              mode: 33188,
              uid: st.uid,
              gid: st.gid,
            })
          } catch {
            cb(Fuse.ENOENT)
          }
        },

        open(path, flags, cb) {
          const name = path.slice(1)
          if (disks.has(name)) {
            const fd = nextFuseFd++
            openFds.set(fd, null)
            return cb(0, fd)
          }
          fsOpen(cacheFilePath(name), flags).then(
            realFd => {
              const fd = nextFuseFd++
              openFds.set(fd, realFd)
              cb(0, fd)
            },
            () => cb(Fuse.ENOENT)
          )
        },

        create(path, mode, cb) {
          const name = path.slice(1)
          if (disks.has(name)) return cb(Fuse.EPERM)
          fsOpen(cacheFilePath(name), nodefs.constants.O_CREAT | nodefs.constants.O_RDWR, mode).then(
            realFd => {
              const fd = nextFuseFd++
              openFds.set(fd, realFd)
              cb(0, fd)
            },
            () => cb(Fuse.EIO)
          )
        },

        release(path, fd, cb) {
          const realFd = openFds.get(fd)
          openFds.delete(fd)
          if (realFd != null) {
            fsClose(realFd).then(
              () => cb(0),
              () => cb(0)
            )
          } else {
            cb(0)
          }
        },

        read(path, fd, buf, len, pos, cb) {
          const disk = disks.get(path.slice(1))
          if (disk !== undefined) {
            disk.read(pos, len).then(
              data => {
                data.copy(buf, 0, 0, data.length)
                cb(data.length)
              },
              () => cb(Fuse.EIO)
            )
            return
          }
          const realFd = openFds.get(fd)
          if (realFd != null) {
            fsRead(realFd, buf, 0, len, pos).then(
              ({ bytesRead }) => cb(bytesRead),
              () => cb(Fuse.EIO)
            )
            return
          }
          cb(Fuse.ENOENT)
        },

        write(path, fd, buf, len, pos, cb) {
          if (disks.has(path.slice(1))) return cb(Fuse.EPERM)
          const realFd = openFds.get(fd)
          if (realFd != null) {
            fsWrite(realFd, buf, 0, len, pos).then(
              ({ bytesWritten }) => cb(bytesWritten),
              () => cb(Fuse.EIO)
            )
            return
          }
          cb(Fuse.ENOENT)
        },

        ftruncate(path, fd, size, cb) {
          if (disks.has(path.slice(1))) return cb(Fuse.EPERM)
          const realFd = openFds.get(fd)
          if (realFd != null) {
            fsFtruncate(realFd, size).then(
              () => cb(0),
              () => cb(Fuse.EIO)
            )
            return
          }
          cb(Fuse.ENOENT)
        },

        truncate(path, size, cb) {
          if (disks.has(path.slice(1))) return cb(Fuse.EPERM)
          fsTruncate(cacheFilePath(path.slice(1)), size).then(
            () => cb(0),
            () => cb(Fuse.EIO)
          )
        },

        unlink(path, cb) {
          if (disks.has(path.slice(1))) return cb(Fuse.EPERM)
          fsUnlink(cacheFilePath(path.slice(1))).then(
            () => cb(0),
            () => cb(Fuse.EIO)
          )
        },
      },
      { debug: false }
    )

    this.#fuse = fuse
    await promisify(fuse.mount.bind(fuse))()
  }

  /**
   * Unmount the FUSE filesystem then close all registered disks.
   */
  async close(): Promise<void> {
    if (this.#fuse !== undefined) {
      await promisify(this.#fuse.unmount.bind(this.#fuse))()
      this.#fuse = undefined
    }
    await Promise.all([...this.#disks.values()].map(d => d.close()))
  }
}
