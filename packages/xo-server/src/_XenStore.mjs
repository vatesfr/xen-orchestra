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
