import { mktree, readdir2, readFile, symlink2 } from '../_fs.mjs'
import { asyncMap } from '@xen-orchestra/async-map'
import filenamify from 'filenamify'
import get from 'lodash/get.js'
import { dirname, join, relative } from 'path'

export default async function createSymlinkIndex([backupDir, fieldPath]) {
  const indexDir = join(backupDir, 'indexes', filenamify(fieldPath))
  await mktree(indexDir)

  await asyncMap(await readdir2(backupDir), async vmDir =>
    asyncMap(
      (await readdir2(vmDir)).filter(_ => _.endsWith('.json')),
      async json => {
        const metadata = JSON.parse(await readFile(json))
        const value = get(metadata, fieldPath)
        if (value !== undefined) {
          const target = relative(indexDir, dirname(json))
          const path = join(indexDir, filenamify(String(value)))
          await symlink2(target, path).catch(error => {
            console.warn('symlink(%s, %s)', target, path, error)
          })
        }
      }
    )
  )
}
