import fromCallback from 'promise-toolbox/fromCallback'
import { execFile } from 'child_process'

export const read = key => fromCallback(execFile, 'xenstore-read', [key])
export const write = (key, value) => fromCallback(execFile, 'xenstore-write', [key, value])
export const rm = key => fromCallback(execFile, 'xenstore-rm', [key])

export async function getCurrentVmUuid() {
  const vm = (await read('vm')).trim()
  const i = vm.lastIndexOf('/')
  if (i === -1) {
    throw new Error('incorrect XenStore VM entry: ' + vm)
  }
  return vm.slice(i + 1)
}
