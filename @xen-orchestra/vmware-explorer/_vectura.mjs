import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import fs from 'node:fs/promises'

// the vectura debian package is small and redistributable: it ships with this package, next to its
// sources and its build process, so the version xo-server installs is always the one it was tested
// against
export const VECTURA_DIR = fileURLToPath(new URL('vectura/', import.meta.url))

// `vectura_0.1.0-1_amd64.deb` holds the upstream version and the debian revision. `vectura
// --version` only prints the upstream one, which is what the two are compared on
const PACKAGE_NAME_RE = /^vectura_(.+?)-\d+_.*\.deb$/

let bundled

async function readBundledPackage() {
  const names = (await fs.readdir(VECTURA_DIR)).filter(name => PACKAGE_NAME_RE.test(name))
  if (names.length !== 1) {
    throw new Error(`expected exactly one vectura package in ${VECTURA_DIR}, found ${names.length}`)
  }
  const [name] = names
  return { path: join(VECTURA_DIR, name), version: name.match(PACKAGE_NAME_RE)[1] }
}

/**
 * The vectura package shipped with this module.
 *
 * The version is read from the file name and not from `dpkg-deb`: the check runs wherever xo-server
 * runs, including where dpkg is not installed.
 *
 * @returns {Promise<{ path: string, version: string }>}
 */
export function getBundledPackage() {
  // the promise is memoized, not its result: two concurrent calls would otherwise both read the
  // directory
  return (bundled ??= readBundledPackage().catch(error => {
    // a transient failure must not be memoized
    bundled = undefined
    throw error
  }))
}

/**
 * Command line of a vectura server exporting one disk of a VM as NBD on its own standard streams.
 *
 * The password is not here on purpose: vectura reads it from `VECTURA_PASSWORD` only, which keeps it
 * out of the command line of a process anyone can list.
 *
 * @param {object} params
 * @param {string} [params.compression] - `skipz`, `zlib` or `none`, vectura defaults to `skipz`
 * @param {number} [params.depth] - host reads kept in flight, 1 to 32, vectura defaults to 16
 * @param {string} params.diskPath - `[datastore] dir/disk.vmdk`
 * @param {string} params.host
 * @param {string} params.thumbprint - `sha256:` and the digest of the management port certificate
 * @param {string} params.user
 * @param {string} params.vmId - managed object reference, such as `3` or `vm-42`
 * @returns {Array<string>}
 */
export function formatVecturaArgs({ compression, depth, diskPath, host, thumbprint, user, vmId }) {
  return [
    'serve',
    '--host',
    host,
    '--user',
    user,
    '--vm-id',
    vmId,
    '--disk',
    diskPath,
    '--thumbprint',
    thumbprint,
    // left out when undefined: vectura's own defaults are the ones we want
    ...(compression !== undefined ? ['--compression', compression] : []),
    ...(depth !== undefined ? ['--depth', String(depth)] : []),
  ]
}
