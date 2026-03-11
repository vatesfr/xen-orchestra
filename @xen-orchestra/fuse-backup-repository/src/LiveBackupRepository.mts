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
  // key: "directory/filename.qcow2"
  readonly #disks = new Map<string, RawConsumer>()
  #fuse: Fuse | undefined

  constructor(mountPoint: string, cachePath: string) {
    this.#mountPoint = mountPoint
    this.#cachePath = cachePath
  }

  /**
   * Register a disk to be exposed as a read-only file at <directory>/<disk.uuid>.qcow2.
   */
  addDisk(disk: RawConsumer, directory: string): void {
    this.#disks.set(`${directory}/${disk.uuid}.qcow2`, disk)
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

    const cacheFilePath = (rel: string) => nodepath.join(cachePath, rel)

    // Returns unique top-level directory names present in the disk map
    const diskDirs = (): Set<string> => {
      const dirs = new Set<string>()
      for (const key of disks.keys()) {
        const slash = key.indexOf('/')
        dirs.add(slash !== -1 ? key.slice(0, slash) : key)
      }
      return dirs
    }

    const dbg = (...args: unknown[]) => console.log('[FUSE]', ...args)

    const fuse = new Fuse(
      this.#mountPoint,
      {
        async readdir(path, cb) {
          dbg('readdir', path)
          const names: string[] = []

          if (path === '/') {
            // top-level: directories derived from disk keys + cache entries
            for (const dir of diskDirs()) names.push(dir)
          } else {
            const dir = path.slice(1)
            const prefix = dir + '/'
            for (const key of disks.keys()) {
              if (key.startsWith(prefix)) names.push(key.slice(prefix.length))
            }
          }

          const cacheDirPath = path === '/' ? cachePath : cacheFilePath(path.slice(1))
          try {
            const cacheEntries = (await fsReaddir(cacheDirPath)) as string[]
            for (const entry of cacheEntries) {
              if (!names.includes(entry)) names.push(entry)
            }
          } catch {
            // cache dir may not exist yet — ignore
          }

          dbg('readdir', path, '->', names)
          cb(0, names)
        },

        async getattr(path, cb) {
          dbg('getattr', path)
          if (path === '/') return cb(0, makeStat('dir', 4096))
          const rel = path.slice(1)

          const disk = disks.get(rel)
          if (disk !== undefined) {
            dbg('getattr', path, '-> disk file', disk.size())
            return cb(0, makeStat('file', disk.size()))
          }

          // Is it a known directory (has disks under it)?
          if ([...disks.keys()].some(k => k.startsWith(rel + '/'))) {
            dbg('getattr', path, '-> disk dir')
            return cb(0, makeStat('dir', 4096))
          }

          try {
            const st = await fsStat(cacheFilePath(rel))
            if (st.isDirectory()) {
              dbg('getattr', path, '-> cache dir')
              return cb(0, makeStat('dir', 4096))
            }
            dbg('getattr', path, '-> cache file', st.size)
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
            dbg('getattr', path, '-> ENOENT')
            cb(Fuse.ENOENT)
          }
        },

        async mkdir(path, mode, cb) {
          dbg('mkdir', path, 'mode=0o' + mode.toString(8))
          try {
            await nodefs.promises.mkdir(cacheFilePath(path.slice(1)), { mode, recursive: true })
            dbg('mkdir', path, '-> ok')
            cb(0)
          } catch (err) {
            dbg('mkdir', path, '-> EIO', err)
            cb(Fuse.EIO)
          }
        },

        open(path, flags, cb) {
          dbg('open', path, 'flags=0o' + flags.toString(8))
          const rel = path.slice(1)
          if (disks.has(rel)) {
            const fd = nextFuseFd++
            openFds.set(fd, null)
            dbg('open', path, '-> disk fd', fd)
            return cb(0, fd)
          }
          fsOpen(cacheFilePath(rel), flags).then(
            realFd => {
              const fd = nextFuseFd++
              openFds.set(fd, realFd)
              dbg('open', path, '-> cache fd', fd, '(real', realFd + ')')
              cb(0, fd)
            },
            err => {
              dbg('open', path, '-> ENOENT', err)
              cb(Fuse.ENOENT)
            }
          )
        },

        create(path, mode, cb) {
          dbg('create', path, 'mode=0o' + mode.toString(8))
          const rel = path.slice(1)
          if (disks.has(rel)) {
            dbg('create', path, '-> EPERM (disk)')
            return cb(Fuse.EPERM)
          }
          const filePath = cacheFilePath(rel)
          nodefs.promises
            .mkdir(nodepath.dirname(filePath), { recursive: true })
            .then(() => fsOpen(filePath, nodefs.constants.O_CREAT | nodefs.constants.O_RDWR, mode))
            .then(realFd => {
              const fd = nextFuseFd++
              openFds.set(fd, realFd)
              dbg('create', path, '-> fd', fd, '(real', realFd + ')')
              cb(0, fd)
            })
            .catch(err => {
              dbg('create', path, '-> EIO', err)
              cb(Fuse.EIO)
            })
        },

        release(path, fd, cb) {
          dbg('release', path, 'fd=', fd)
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
          dbg('read', path, 'fd=', fd, 'len=', len, 'pos=', pos)
          const disk = disks.get(path.slice(1))
          if (disk !== undefined) {
            disk.read(pos, len).then(
              data => {
                data.copy(buf, 0, 0, data.length)
                cb(data.length)
              },
              err => {
                dbg('read', path, '-> EIO', err)
                cb(Fuse.EIO)
              }
            )
            return
          }
          const realFd = openFds.get(fd)
          if (realFd != null) {
            fsRead(realFd, buf, 0, len, pos).then(
              ({ bytesRead }) => cb(bytesRead),
              err => {
                dbg('read', path, '-> EIO', err)
                cb(Fuse.EIO)
              }
            )
            return
          }
          dbg('read', path, '-> ENOENT (no fd in map)')
          cb(Fuse.ENOENT)
        },

        write(path, fd, buf, len, pos, cb) {
          dbg('write', path, 'fd=', fd, 'len=', len, 'pos=', pos)
          if (disks.has(path.slice(1))) {
            dbg('write', path, '-> EPERM (disk)')
            return cb(Fuse.EPERM)
          }
          const realFd = openFds.get(fd)
          if (realFd != null) {
            fsWrite(realFd, buf, 0, len, pos).then(
              ({ bytesWritten }) => cb(bytesWritten),
              err => {
                dbg('write', path, '-> EIO', err)
                cb(Fuse.EIO)
              }
            )
            return
          }
          dbg('write', path, '-> ENOENT (no fd in map)')
          cb(Fuse.ENOENT)
        },

        ftruncate(path, fd, size, cb) {
          dbg('ftruncate', path, 'fd=', fd, 'size=', size)
          if (disks.has(path.slice(1))) {
            dbg('ftruncate', path, '-> EPERM (disk)')
            return cb(Fuse.EPERM)
          }
          const realFd = openFds.get(fd)
          if (realFd != null) {
            fsFtruncate(realFd, size).then(
              () => cb(0),
              err => {
                dbg('ftruncate', path, '-> EIO', err)
                cb(Fuse.EIO)
              }
            )
            return
          }
          dbg('ftruncate', path, '-> ENOENT (no fd in map)')
          cb(Fuse.ENOENT)
        },

        truncate(path, size, cb) {
          dbg('truncate', path, 'size=', size)
          if (disks.has(path.slice(1))) {
            dbg('truncate', path, '-> EPERM (disk)')
            return cb(Fuse.EPERM)
          }
          fsTruncate(cacheFilePath(path.slice(1)), size).then(
            () => cb(0),
            err => {
              dbg('truncate', path, '-> EIO', err)
              cb(Fuse.EIO)
            }
          )
        },

        unlink(path, cb) {
          dbg('unlink', path)
          if (disks.has(path.slice(1))) {
            dbg('unlink', path, '-> EPERM (disk)')
            return cb(Fuse.EPERM)
          }
          fsUnlink(cacheFilePath(path.slice(1))).then(
            () => {
              dbg('unlink', path, '-> ok')
              cb(0)
            },
            err => {
              dbg('unlink', path, '-> EIO', err)
              cb(Fuse.EIO)
            }
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
