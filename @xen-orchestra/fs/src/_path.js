import path from 'path'

const { basename, dirname, join, resolve, sep } = path.posix

export { basename, dirname, join }

// normalize the path:
// - does not contains `.` or `..`  (cannot escape root dir)
// - always starts with `/`
// - no trailing slash (expect for root)
// - no duplicate slashes
export const normalize = path => resolve('/', path)

export function split(path) {
  const parts = normalize(path).split(sep)

  // remove first (empty) entry
  parts.shift()

  return parts
}
