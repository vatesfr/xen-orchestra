import Disposable from 'promise-toolbox/Disposable'
import { createLogger } from '@xen-orchestra/log'
import { join } from 'node:path'
import { mkdir, rmdir } from 'node:fs/promises'
import { tmpdir } from 'os'

const { debug } = createLogger('xo:backups:getTmpDir')

const MAX_ATTEMPTS = 3

export async function getTmpDir() {
  for (let i = 0; true; ++i) {
    const path = join(tmpdir(), Math.random().toString(36).slice(2))
    try {
      debug('creating directory', { path })
      await mkdir(path)
      return new Disposable(() => {
        debug('removing directory', { path })
        return rmdir(path)
      }, path)
    } catch (error) {
      if (i === MAX_ATTEMPTS) {
        throw error
      }
    }
  }
}
