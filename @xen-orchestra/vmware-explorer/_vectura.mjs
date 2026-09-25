import { fileURLToPath } from 'node:url'

// the vectura binary is small and redistributable: it ships with this package, next to its sources
// and its build process, so the binary xo-server runs is always the one it was tested against
export const VECTURA_BIN = fileURLToPath(new URL('vectura/vectura', import.meta.url))

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
