import path from 'path'

const { resolve } = path.posix

// normalize the path:
// - does not contains `.` or `..`  (cannot escape root dir)
// - always starts with `/`
// - no trailing slash (expect for root)
// - no duplicate slashes
const normalizePath = path => resolve('/', path)
export { normalizePath as default }
