import Disposable from 'promise-toolbox/Disposable'
import { join } from 'node:path'
import { mkdir, rmdir } from 'node:fs/promises'
import { tmpdir } from 'os'

const MAX_ATTEMPTS = 3

export async function getTmpDir() {
  for (let i = 0; true; ++i) {
    const path = join(tmpdir(), Math.random().toString(36).slice(2))
    try {
      await mkdir(path)
      return new Disposable(() => rmdir(path), path)
    } catch (error) {
      if (i === MAX_ATTEMPTS) {
        throw error
      }
    }
  }
}
