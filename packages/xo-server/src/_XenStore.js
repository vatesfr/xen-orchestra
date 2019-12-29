import fromCallback from 'promise-toolbox/fromCallback'
import { execFile } from 'child_process'

export const read = key => fromCallback(execFile, 'xenstore-read', [key])
