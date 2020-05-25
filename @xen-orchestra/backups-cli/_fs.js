const { dirname } = require('path')

const fs = require('promise-toolbox/promisifyAll')(require('fs'))
module.exports = fs

fs.mktree = async function mkdirp(path) {
  try {
    await fs.mkdir(path)
  } catch (error) {
    const { code } = error
    if (code === 'EEXIST') {
      await fs.readdir(path)
      return
    }
    if (code === 'ENOENT') {
      await mkdirp(dirname(path))
      return mkdirp(path)
    }
    throw error
  }
}

// - easier:
//   - single param for direct use in `Array#map`
//   - files are prefixed with directory path
// - safer: returns empty array if path is missing or not a directory
fs.readdir2 = path =>
  fs.readdir(path).then(
    entries => {
      entries.forEach((entry, i) => {
        entries[i] = `${path}/${entry}`
      })

      return entries
    },
    error => {
      const { code } = error
      if (code === 'ENOENT') {
        // do nothing
      } else if (code === 'ENOTDIR') {
        console.warn('WARN: readdir(%s)', path, error)
      } else {
        throw error
      }
      return []
    }
  )

fs.symlink2 = async (target, path) => {
  try {
    await fs.symlink(target, path)
  } catch (error) {
    if (error.code === 'EEXIST' && (await fs.readlink(path)) === target) {
      return
    }
    throw error
  }
}
