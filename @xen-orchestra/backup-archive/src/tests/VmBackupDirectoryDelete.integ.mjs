import test from 'node:test'
import { strict as assert } from 'node:assert'

import tmp from 'tmp'
import fs from 'fs-extra'
import { getHandler } from '@xen-orchestra/fs'
import { pFromCallback } from 'promise-toolbox'
import { rimraf } from 'rimraf'
// eslint-disable-next-line n/no-missing-import
import { VmBackupDirectory } from '../VmBackupDirectory.mjs'

const { beforeEach, afterEach, describe } = test

let tempDir, handler, cleanVmCalls
const vmUuid = 'test-vm-uuid'
const rootPath = `xo-vm-backups/${vmUuid}`
const cachePath = `${rootPath}/cache.json.gz`

// `VmBackupDirectory.updateCache` is a lock-free read-modify-write: its callers own the
// locking. `deleteVmBackups` updates the same cache file from several concurrent branches,
// so the injected `updateCache` must be serialized per path, as `RemoteAdapter` does with
// `synchronized.withKey()`.
// `regenerate: true` mirrors `RemoteAdapter._updateCache`: a missing cache is rebuilt from
// the directory listing rather than left missing.
const locks = new Map()
const updateCache = (path, fn) => {
  const promise = (locks.get(path) ?? Promise.resolve()).then(() =>
    VmBackupDirectory.updateCache(handler, path, fn, { regenerate: true })
  )
  locks.set(
    path,
    promise.catch(() => {})
  )
  return promise
}

beforeEach(async () => {
  tempDir = await pFromCallback(cb => tmp.dir(cb))
  handler = getHandler({ url: `file://${tempDir}` })
  await handler.sync()
  await fs.mkdirp(`${tempDir}/${rootPath}`)
  cleanVmCalls = []
  locks.clear()
})

afterEach(async () => {
  await rimraf(tempDir)
  await handler.forget()
})

const cleanVm = async (dir, opts) => {
  cleanVmCalls.push({ dir, opts })
}

async function writeDeltaBackup(name, { vhds = [] } = {}) {
  const path = `${rootPath}/${name}.json`
  for (const vhd of vhds) {
    await handler.outputFile(`${rootPath}/${vhd}`, 'vhd content')
  }
  await handler.outputFile(
    path,
    JSON.stringify({ mode: 'delta', vm: { uuid: vmUuid, is_a_template: false }, timestamp: 1, vhds })
  )
  return path
}

async function writeFullBackup(name, { checksum = true } = {}) {
  const path = `${rootPath}/${name}.json`
  await handler.outputFile(`${rootPath}/${name}.xva`, 'xva content')
  if (checksum) {
    await handler.outputFile(`${rootPath}/${name}.xva.checksum`, 'checksum')
  }
  await handler.outputFile(
    path,
    JSON.stringify({ mode: 'full', vm: { uuid: vmUuid, is_a_template: false }, timestamp: 1, xva: `./${name}.xva` })
  )
  return path
}

const seedCache = paths =>
  VmBackupDirectory.writeCache(handler, cachePath, Object.fromEntries(paths.map(path => [path, { _filename: path }])))

describe('deleteDeltaVmBackups', () => {
  test('removes the metadata and its cache entry, but keeps the VHDs', async () => {
    const path = await writeDeltaBackup('20240102T030405Z', { vhds: ['vdis/job/vdi/disk.vhd'] })
    const keptPath = await writeDeltaBackup('20240102T030406Z')
    await seedCache([path, keptPath])

    await VmBackupDirectory.deleteDeltaVmBackups(handler, [{ _filename: path }], { updateCache })

    assert.equal(await fs.pathExists(`${tempDir}/${path}`), false)
    // unused VHDs are detected and removed by cleanVm, not here
    assert.equal(await fs.pathExists(`${tempDir}/${rootPath}/vdis/job/vdi/disk.vhd`), true)
    assert.deepEqual(Object.keys(await VmBackupDirectory.readCache(handler, cachePath)), [keptPath])
  })
})

describe('deleteFullVmBackups', () => {
  test('removes the metadata, the XVA and its checksum', async () => {
    const path = await writeFullBackup('20240102T030405Z')
    await seedCache([path])

    await VmBackupDirectory.deleteFullVmBackups(handler, [{ _filename: path, xva: './20240102T030405Z.xva' }], {
      updateCache,
    })

    for (const file of ['20240102T030405Z.json', '20240102T030405Z.xva', '20240102T030405Z.xva.checksum']) {
      assert.equal(await fs.pathExists(`${tempDir}/${rootPath}/${file}`), false)
    }
    assert.deepEqual(await VmBackupDirectory.readCache(handler, cachePath), {})
  })

  test('tolerates a missing checksum', async () => {
    const path = await writeFullBackup('20240102T030405Z', { checksum: false })
    await seedCache([path])

    await VmBackupDirectory.deleteFullVmBackups(handler, [{ _filename: path, xva: './20240102T030405Z.xva' }], {
      updateCache,
    })

    assert.equal(await fs.pathExists(`${tempDir}/${rootPath}/20240102T030405Z.xva`), false)
  })

  test('fails when the XVA cannot be removed for another reason than ENOENT', async () => {
    const failing = {
      unlink: async path => {
        if (path.endsWith('.xva')) {
          const error = new Error('EACCES')
          error.code = 'EACCES'
          throw error
        }
      },
    }

    await assert.rejects(
      VmBackupDirectory.deleteFullVmBackups(failing, [{ _filename: `${rootPath}/a.json`, xva: './a.xva' }], {
        updateCache: async () => {},
      }),
      { code: 'EACCES' }
    )
  })
})

describe('deleteVmBackups', () => {
  test('dispatches on the backup mode and cleans each directory once', async () => {
    const deltaPath = await writeDeltaBackup('20240102T030405Z', { vhds: ['vdis/job/vdi/disk.vhd'] })
    const fullPath = await writeFullBackup('20240102T030406Z')
    await seedCache([deltaPath, fullPath])

    await VmBackupDirectory.deleteVmBackups(handler, [deltaPath, fullPath], { updateCache, cleanVm })

    assert.equal(await fs.pathExists(`${tempDir}/${deltaPath}`), false)
    assert.equal(await fs.pathExists(`${tempDir}/${fullPath}`), false)
    assert.equal(await fs.pathExists(`${tempDir}/${rootPath}/20240102T030406Z.xva`), false)
    assert.deepEqual(await VmBackupDirectory.readCache(handler, cachePath), {})

    // both backups are in the same directory => a single cleanVm
    assert.equal(cleanVmCalls.length, 1)
    assert.equal(cleanVmCalls[0].dir, rootPath)
    assert.equal(cleanVmCalls[0].opts.remove, true)
  })

  test('removes the cache entry of a backup whose metadata is already gone', async () => {
    const path = await writeDeltaBackup('20240102T030405Z')
    const missingPath = `${rootPath}/20240102T030406Z.json`
    await seedCache([path, missingPath])

    await VmBackupDirectory.deleteVmBackups(handler, [path, missingPath], { updateCache, cleanVm })

    assert.deepEqual(await VmBackupDirectory.readCache(handler, cachePath), {})
  })

  test('does not fail when cleanVm fails', async () => {
    const path = await writeDeltaBackup('20240102T030405Z')
    await seedCache([path])

    await VmBackupDirectory.deleteVmBackups(handler, [path], {
      updateCache,
      cleanVm: async () => {
        throw new Error('a backup is running')
      },
    })

    assert.equal(await fs.pathExists(`${tempDir}/${path}`), false)
  })
})
