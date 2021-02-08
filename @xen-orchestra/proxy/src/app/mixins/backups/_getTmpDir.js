import Disposable from 'promise-toolbox/Disposable'
import { join } from 'path'
import { mkdir, rmdir } from 'fs-extra'
import { tmpdir } from 'os'

const MAX_ATTEMPTS = 3

export const getTmpDir = async () => {
  for (let i = 0; true; ++i) {
    const path = join(tmpdir(), Math.random().toString(36).slice(2))
    try {
      await mkdir(path)
      return new Disposable(path, () => rmdir(path))
    } catch (error) {
      if (i === MAX_ATTEMPTS) {
        throw error
      }
    }
  }
}
