'use strict'

const LRU = require('lru-cache')
const Fuse = require('fuse-native')
const { VhdSynthetic } = require('vhd-lib')

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

exports.mount = async (handler, diskPath, mountDir) => {
  const { value: vhd } = await VhdSynthetic.fromVhdChain(handler, diskPath)
  const cache = new LRU({
    max: 16, // each cached block is 2MB in size
  })
  await vhd.readBlockAllocationTable()
  const fuse = new Fuse(mountDir, {
    async readdir(path, cb) {
      if (path === '/') {
        return cb(null, ['vhd'])
      }
      cb(new Error('can t list it '))
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
      return cb(
        null,
        stat({
          mode: 'file',
          size: vhd.footer.currentSize,
        })
      )
    },
    async read(path, fd, buf, len, pos, cb) {
      const data = await vhd.readRawData(pos, len, cache)
      data.copy(buf)
      cb(data.length)
    },
  })
  return new Promise((resolve, reject) => {
    fuse.mount(function (err) {
      if (err) {
        return reject(err)
      }
      resolve(fuse)
    })
  })
}
