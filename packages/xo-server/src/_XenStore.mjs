import fromCallback from 'promise-toolbox/fromCallback'
import { execFile } from 'child_process'

const xenStoreExec = (command, args) =>
  fromCallback(execFile, command, args).catch(err => {
    if (err.code === 'ENOENT') {
      throw new Error(`${command} not found — xo-server must run inside an XCP-ng VM to use this feature`, {
        cause: err,
      })
    }
    if (typeof err.code === 'number' && /permission denied/i.test(err.stderr)) {
      throw new Error(
        `${command} requires root privileges — run xo-server as root or grant access to the xenstored socket to use this feature`,
        { cause: err }
      )
    }
    throw err
  })

/**
 * Whether the XenStore failed because XO does not run in a Xen VM: there is no client to read it,
 * or no XenStore for that client to talk to. Any other failure, e.g. not being allowed to read it,
 * is a misconfiguration of a VM which has one.
 *
 * @param {unknown} error
 * @returns {boolean}
 */
export const isNotInXenVm = error =>
  // the callback form of `execFile` does not attach the output to the error, only to its message
  error?.cause?.code === 'ENOENT' || /xs_open: no such file or directory/i.test(error?.message ?? '')

export const read = key => xenStoreExec('xenstore-read', [key])
export const write = (key, value) => xenStoreExec('xenstore-write', [key, value])
export const rm = key => xenStoreExec('xenstore-rm', [key])

export async function getCurrentVmUuid() {
  const vm = (await read('vm')).trim()
  const i = vm.lastIndexOf('/')
  if (i === -1) {
    throw new Error('incorrect XenStore VM entry: ' + vm)
  }
  return vm.slice(i + 1)
}
