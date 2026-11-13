// the error of proper-lockfile, which LocalHandler uses: callers and the documentation know this one
export default function lockedError(path) {
  return Object.assign(new Error('Lock file is already being held'), { code: 'ELOCKED', file: path })
}
