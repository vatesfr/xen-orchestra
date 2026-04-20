import fromCallback from 'promise-toolbox/fromCallback'
import { execFile } from 'child_process'

export const read = key => fromCallback(execFile, 'xenstore-read', [key])
export const write = (key, value) => fromCallback(execFile, 'xenstore-write', [key, value])
export const rm = key => fromCallback(execFile, 'xenstore-rm', [key])
