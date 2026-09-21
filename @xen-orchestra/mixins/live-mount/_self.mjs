import { execFile } from 'node:child_process'
import fromCallback from 'promise-toolbox/fromCallback'

// XenStore entry every guest can read, holding the path of its own VM record
const SELF_VM_KEY = 'vm'

// XAPI's code for "no object of this class has this uuid"
const UUID_INVALID = 'UUID_INVALID'

const readSelfVmEntry = () => fromCallback(execFile, 'xenstore-read', [SELF_VM_KEY])

/**
 * The uuid of the VM this appliance runs in, read from XenStore.
 *
 * Deliberately a copy of what `xo-server`'s private `_XenStore.mjs` does rather
 * than an import of it: this mixin is shared with xo-proxy, which has no access
 * to xo-server's internals. It stays a handful of lines, and it is injectable
 * on `LiveMount` so a host which knows better can supply its own.
 */
export async function getSelfVmUuid({ readXenStore = readSelfVmEntry } = {}) {
  let entry
  try {
    entry = await readXenStore()
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error('xenstore-read not found — this appliance must run inside an XCP-ng VM to use a read cache', {
        cause: error,
      })
    }
    if (/permission denied/i.test(error.stderr ?? '')) {
      throw new Error(
        'xenstore-read requires root privileges — run this appliance as root, or grant it access to the xenstored socket, to use a read cache',
        { cause: error }
      )
    }
    throw error
  }

  // the entry is the VM's XenStore path, e.g. `/vm/<uuid>`
  const path = entry.trim()
  const i = path.lastIndexOf('/')
  if (i === -1 || i === path.length - 1) {
    throw new Error(`incorrect XenStore VM entry: ${path}`)
  }
  return path.slice(i + 1)
}

/**
 * Resolve this appliance's own VM on `xapi`.
 *
 * The cache VDI is attached to that VM, so it can only be created on the pool
 * the appliance itself belongs to. When the disk is being mounted onto a host
 * of another pool, XAPI answers `UUID_INVALID` and there is nothing sensible to
 * fall back to: silently serving the mount without a cache would turn an
 * explicit request into an unexplained performance cliff, so it is reported.
 *
 * @param {object} xapi - XAPI connection of the pool the disk is mounted onto
 * @param {string} vmUuid - uuid of this appliance's VM, from {@link getSelfVmUuid}
 * @returns {Promise<string>} opaque ref of this appliance's VM
 */
export async function resolveSelfVmRef(xapi, vmUuid) {
  try {
    return await xapi.call('VM.get_by_uuid', vmUuid)
  } catch (error) {
    if (error?.code === UUID_INVALID) {
      throw new Error(
        `the read cache needs this appliance to be a VM of the pool the disk is mounted onto, but its VM ${vmUuid} is unknown there — mount without a cache, or pick a host in this appliance's own pool`,
        { cause: error }
      )
    }
    throw error
  }
}
