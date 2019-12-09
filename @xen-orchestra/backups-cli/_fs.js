const fs = require('promise-toolbox/promisifyAll')(require('fs'))
module.exports = fs

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
      if (
        error != null &&
        (error.code === 'ENOENT' || error.code === 'ENOTDIR')
      ) {
        console.warn('WARN: readdir(%s)', path, error)
        return []
      }
      throw error
    }
  )
