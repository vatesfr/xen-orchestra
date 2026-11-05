import Fuse from 'fuse-native'
import LRU from 'lru-cache'
import { createLogger } from '@xen-orchestra/log'
import { VhdSynthetic } from 'vhd-lib'
import { Disposable, fromCallback } from 'promise-toolbox'

const { warn } = createLogger('vates:fuse-vhd')

// build a stat object from https://github.com/fuse-friends/fuse-native/blob/master/test/fixtures/stat.js
const stat = st => ({
  mtime: st.mtime || new Date(),
  atime: st.atime || new Date(),
  ctime: st.ctime || new Date(),
  size: st.size !== undefined ? st.size : 0,
  mode: st.mode === 'dir' ? 16877 : st.mode === 'file' ? 33188 : st.mode === 'link' ? 41453 : st.mode,
  uid: st.uid !== undefined ? st.uid : process.getuid(),
  gid: st.gid !== undefined ? st.gid : process.getgid(),
})

export const mount = Disposable.factory(async function* mount(handler, diskPath, mountDir) {
  const vhd = yield VhdSynthetic.fromVhdChain(handler, diskPath)

  await vhd.readBlockAllocationTable()
  const { blockSize } = vhd.header

  // A zeroed buffer returned for VHD blocks that are not present in the chain.
  // Never mutated — safe to share across all reads.
  const EMPTY_BLOCK = Buffer.alloc(blockSize, 0)

  // --- coalescing block read queue ---
  //
  // FUSE read requests from NTFS-3g arrive in small chunks (typically 4 KiB)
  // while VHD blocks are 2 MiB. Reading blocks one at a time from the backing
  // store (CIFS/NFS/…) bounds libuv threadpool usage to 1 concurrent I/O call.
  //
  // Coalescing: all pending requests for the same blockId share a single
  // readBlock() call. When the block resolves, every waiter is fulfilled at once.
  //
  // Together these two properties prevent the FUSE-on-FUSE threadpool deadlock:
  // concurrent NTFS-3g reads no longer starve the VHD block reads they depend on.
  // In-memory block cache. Each VHD block is 2 MiB; 16 blocks = 32 MiB.
  // This is the primary tool against the 300× CIFS amplification: NTFS-3g
  // reads a 2 MiB block in ~512 sequential 4 KiB FUSE requests. Without a
  // cache, each request causes a full 2 MiB CIFS read. With the cache, only
  // the first request reads from CIFS; the rest are served from RAM.
  const blockCache = new LRU({ max: 64 })

  const pendingBlocks = new Map() // blockId → Promise<Buffer>
  const readQueue = [] // { blockId, resolve, reject }[]
  let queueRunning = false

  // log stats every 10 s while there is activity

  function enqueueBlock(blockId) {
    // 1. serve from cache if available
    if (blockCache.has(blockId)) {
      return Promise.resolve(blockCache.get(blockId))
    }
    // 2. coalesce: join an existing in-flight read for this block
    if (pendingBlocks.has(blockId)) {
      return pendingBlocks.get(blockId)
    }
    const p = new Promise((resolve, reject) => {
      readQueue.push({ blockId, resolve, reject })
    })
    pendingBlocks.set(blockId, p)
    p.then(
      data => {
        pendingBlocks.delete(blockId)
        blockCache.set(blockId, data)
      },
      () => pendingBlocks.delete(blockId)
    )
    drainQueue()
    return p
  }

  function drainQueue() {
    if (queueRunning) return
    queueRunning = true
    // async IIFE — errors are forwarded to individual reject() callbacks,
    // so the outer floating promise is always fulfilled
    ;(async () => {
      while (readQueue.length > 0) {
        const { blockId, resolve, reject } = readQueue.shift()
        try {
          resolve((await vhd.readBlock(blockId)).data)
        } catch (err) {
          reject(err)
        }
      }
      queueRunning = false
    })()
  }

  async function readData(buf, len, pos) {
    if (len === 0) return 0
    const startBlockId = Math.floor(pos / blockSize)
    // use (pos + len - 1) so an exact block boundary doesn't include the next block
    const endBlockId = Math.floor((pos + len - 1) / blockSize)

    let copied = 0
    for (let blockId = startBlockId; blockId <= endBlockId; blockId++) {
      const data = vhd.containsBlock(blockId) ? await enqueueBlock(blockId) : EMPTY_BLOCK
      const offsetStart = blockId === startBlockId ? pos % blockSize : 0
      const offsetEnd = blockId === endBlockId ? ((pos + len - 1) % blockSize) + 1 : blockSize
      data.copy(buf, copied, offsetStart, offsetEnd)
      copied += offsetEnd - offsetStart
    }
    return copied
  }

  const fuse = new Fuse(mountDir, {
    async readdir(path, cb) {
      if (path === '/') return cb(null, ['vhd0'])
      cb(Fuse.ENOENT)
    },
    async getattr(path, cb) {
      if (path === '/') return cb(null, stat({ mode: 'dir', size: 4096 }))
      if (path === '/vhd0') return cb(null, stat({ mode: 'file', size: vhd.footer.currentSize }))
      cb(Fuse.ENOENT)
    },
    read(path, fd, buf, len, pos, cb) {
      if (path === '/vhd0') {
        return readData(buf, len, pos).then(cb, error => {
          warn('read error', { path, len, pos, error })
          cb(Fuse.EIO)
        })
      }
      throw new Error(`read file ${path} not exists`)
    },
  })
  return new Disposable(
    () => {
      return fromCallback(cb => fuse.unmount(cb))
    },
    fromCallback(cb => fuse.mount(cb))
  )
})
