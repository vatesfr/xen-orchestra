import LRU from 'lru-cache'
import Fuse from 'fuse-native'
import { createLogger } from '@xen-orchestra/log'
import { VhdSynthetic } from 'vhd-lib'
import { Disposable, fromCallback } from 'promise-toolbox'

const { warn } = createLogger('vates:fuse-vhd')

// build a s stat object from https://github.com/fuse-friends/fuse-native/blob/master/test/fixtures/stat.js
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

  const cache = new LRU({
    max: 16, // each cached block is 2MB in size
  })
  await vhd.readBlockAllocationTable()
  const fuse = new Fuse(mountDir, {
    async readdir(path, cb) {
      if (path === '/') {
        return cb(null, ['vhd0'])
      }
      cb(Fuse.ENOENT)
    },
    async getattr(path, cb) {
      if (path === '/') {
        return cb(
          null,
          stat({
            mode: 'dir',
            size: 4096,
          })
        )
      }
      if (path === '/vhd0') {
        return cb(
          null,
          stat({
            mode: 'file',
            size: vhd.footer.currentSize,
          })
        )
      }

      cb(Fuse.ENOENT)
    },
    read(path, fd, buf, len, pos, cb) {
      if (path === '/vhd0') {
        return vhd.readRawData(pos, len, cache, buf).then(cb, error => {
          warn('read error', { path, len, pos, error })
          cb(Fuse.EIO)
        })
      }
      throw new Error(`read file ${path} not exists`)
    },
  })
  return new Disposable(
    () => fromCallback(cb => fuse.unmount(cb)),
    fromCallback(cb => fuse.mount(cb))
  )
})
