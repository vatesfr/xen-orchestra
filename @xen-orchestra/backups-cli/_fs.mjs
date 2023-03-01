import fs from 'fs/promises'
import { dirname } from 'path'

export * from 'fs/promises'

export const getSize = path =>
  fs.stat(path).then(
    _ => _.size,
    error => {
      if (error.code === 'ENOENT') {
        return 0
      }
      throw error
    }
  )

export async function mktree(path) {
  try {
    await fs.mkdir(path)
  } catch (error) {
    const { code } = error
    if (code === 'EEXIST') {
      await fs.readdir(path)
      return
    }
    if (code === 'ENOENT') {
      await mktree(dirname(path))
      return mktree(path)
    }
    throw error
  }
}

// - easier:
//   - single param for direct use in `Array#map`
//   - files are prefixed with directory path
// - safer: returns empty array if path is missing or not a directory
export const readdir2 = path =>
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

export async function symlink2(target, path) {
  try {
    await fs.symlink(target, path)
  } catch (error) {
    if (error.code === 'EEXIST' && (await fs.readlink(path)) === target) {
      return
    }
    throw error
  }
}
