import Disposable from 'promise-toolbox/Disposable'
import fromCallback from 'promise-toolbox/fromCallback'
import tmp from 'tmp'
import { rmdir } from 'fs-extra'

export const getTmpDir = async () => {
  const tmpDir = await fromCallback(tmp.dir)
  return new Disposable(tmpDir, () => rmdir(tmpDir))
}
