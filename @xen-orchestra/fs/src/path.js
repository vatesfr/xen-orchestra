import path from 'path'

const { basename, dirname, join, resolve, relative, sep } = path.posix

export { basename, dirname, join }

// normalize the path:
// - does not contains `.` or `..`  (cannot escape root dir)
// - always starts with `/`
// - no trailing slash (expect for root)
// - no duplicate slashes
export const normalize = path => resolve('/', path)

// true if `path` is `dir` itself, or is contained in `dir`
export function isInDir(path, dir) {
  const normalizedDir = normalize(dir)
  const normalizedPath = normalize(path)

  return (
    normalizedPath === normalizedDir || normalizedPath.startsWith(normalizedDir === '/' ? '/' : normalizedDir + '/')
  )
}

export function split(path) {
  const parts = normalize(path).split(sep)

  // remove first (empty) entry
  parts.shift()

  return parts
}

// paths are made absolute otherwise fs.relative() would resolve them against working directory
export const relativeFromFile = (file, path) => relative(dirname(normalize(file)), normalize(path))

export const resolveFromFile = (file, path) => resolve('/', dirname(file), path).slice(1)
