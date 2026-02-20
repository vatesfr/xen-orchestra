import test from 'node:test'
import { strict as assert } from 'node:assert'

import tmp from 'tmp'
import fs from 'fs-extra'
import * as uuid from 'uuid'
import { getHandler } from '@xen-orchestra/fs'
import { pFromCallback } from 'promise-toolbox'
import { rimraf } from 'rimraf'
import { VmBackupDirectory } from '../dist/VmBackupDirectory.mjs'

const { beforeEach, afterEach, describe } = test

let tempDir, handler, vmBackupDir
const vmUuid = 'test-vm-uuid'
const rootPath = `xo-vm-backups/${vmUuid}`

beforeEach(async () => {
  tempDir = await pFromCallback(cb => tmp.dir(cb))
  handler = getHandler({ url: `file://${tempDir}` })
  await handler.sync()
  await fs.mkdirp(`${tempDir}/${rootPath}`)
  vmBackupDir = new VmBackupDirectory(handler, rootPath)
})

afterEach(async () => {
  await rimraf(tempDir)
  await handler.forget()
})

const uniqueId = () => uuid.v1()

async function createFullBackupMetadata(name, xvaName) {
  const metadata = {
    mode: 'full',
    xva: `${rootPath}/${xvaName}`,
    vm: { uuid: vmUuid },
    jobId: uniqueId(),
    timestamp: Date.now(),
  }
  await handler.writeFile(`${rootPath}/${name}`, JSON.stringify(metadata))
  await handler.writeFile(`${rootPath}/${xvaName}`, 'fake-xva-content')
  return metadata
}

describe('VmBackupDirectory with full backups', { concurrency: 1 }, () => {
  test('init() loads full backup archives from metadata files', async () => {
    await createFullBackupMetadata('backup1.json', 'backup1.xva')
    await createFullBackupMetadata('backup2.json', 'backup2.xva')

    await vmBackupDir.init()

    assert.equal(vmBackupDir.backupArchives.size, 2)
  })

  test('getValidFiles() returns cache files', async () => {
    // Create a cache file
    await handler.writeFile(`${rootPath}/cache.json.gz`, 'cache-content')
    await vmBackupDir.init()

    const filesWithPrefix = vmBackupDir.getValidFiles({ prefix: true })
    const filesWithoutPrefix = vmBackupDir.getValidFiles({ prefix: false })

    assert.equal(filesWithPrefix.length, 1)
    assert.ok(filesWithPrefix[0].endsWith('cache.json.gz'))
    assert.deepEqual(filesWithoutPrefix, ['cache.json.gz'])
  })

  test('check() identifies orphan files', async () => {
    // Create a valid backup
    await createFullBackupMetadata('backup1.json', 'backup1.xva')
    // Create orphan files (not referenced by any metadata)
    await handler.writeFile(`${rootPath}/orphan.xva`, 'orphan-content')
    await handler.writeFile(`${rootPath}/random-file.txt`, 'random')

    await vmBackupDir.init()
    const { orphans, linked } = await vmBackupDir.check()

    assert.ok(orphans.some(f => f.includes('orphan.xva')))
    assert.ok(orphans.some(f => f.includes('random-file.txt')))
    assert.ok(linked.some(f => f.includes('backup1.json')))
    assert.ok(linked.some(f => f.includes('backup1.xva')))
  })

  test('clean() removes orphan files', async () => {
    await createFullBackupMetadata('backup1.json', 'backup1.xva')
    await handler.writeFile(`${rootPath}/orphan.xva`, 'orphan-content')

    await vmBackupDir.init()
    await vmBackupDir.clean()

    const remainingFiles = await handler.list(rootPath)
    assert.ok(remainingFiles.includes('backup1.json'))
    assert.ok(remainingFiles.includes('backup1.xva'))
    assert.ok(!remainingFiles.includes('orphan.xva'))
  })

  test('clean() preserves cache.json.gz', async () => {
    await createFullBackupMetadata('backup1.json', 'backup1.xva')
    await handler.writeFile(`${rootPath}/cache.json.gz`, 'cache')

    await vmBackupDir.init()
    await vmBackupDir.clean()

    const remainingFiles = await handler.list(rootPath)
    assert.equal(remainingFiles.length, 3)
    assert.ok(remainingFiles.includes('cache.json.gz'))
  })
})
