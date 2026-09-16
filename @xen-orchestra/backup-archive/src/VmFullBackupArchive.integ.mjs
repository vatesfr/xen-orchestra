import test from 'node:test'
import { strict as assert } from 'node:assert'

import tmp from 'tmp'
import fs from 'fs-extra'
import * as uuid from 'uuid'
import { getHandler } from '@xen-orchestra/fs'
import { pFromCallback } from 'promise-toolbox'
import { rimraf } from 'rimraf'
// eslint-disable-next-line n/no-missing-import
import { VmBackupDirectory } from '../dist/VmBackupDirectory.mjs'
import tar from 'tar-stream'
import { promisify } from 'node:util'
import zlib from 'node:zlib'
const { beforeEach, afterEach, describe } = test

const gzip = promisify(zlib.gzip)
const gunzip = promisify(zlib.gunzip)

let tempDir, handler, vmBackupDir
const vmUuid = 'test-vm-uuid'
const rootPath = `xo-vm-backups/${vmUuid}`

async function createMinimalXva() {
  const pack = tar.pack()
  pack.entry({ name: 'ova.xml' }, '<value><struct/></value>')
  pack.finalize()

  const chunks = []
  for await (const chunk of pack) {
    chunks.push(chunk)
  }
  return Buffer.concat(chunks)
}

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
  await handler.writeFile(`${rootPath}/${xvaName}`, await createMinimalXva())
  const size = await handler.getSize(`${rootPath}/${xvaName}`)
  const metadata = {
    mode: 'full',
    xva: `./${xvaName}`,
    vm: { uuid: vmUuid },
    jobId: uniqueId(),
    timestamp: Date.now(),
    size,
  }
  await handler.writeFile(`${rootPath}/${name}`, JSON.stringify(metadata))
  return metadata
}

describe('VmBackupDirectory with full backups', { concurrency: 1 }, () => {
  test('init() loads full backup archives from metadata files', async () => {
    await createFullBackupMetadata('backup1.json', 'backup1.xva')
    await createFullBackupMetadata('backup2.json', 'backup2.xva')

    await vmBackupDir.init()

    assert.equal(vmBackupDir.backupArchives.size, 2)
  })

  test('getAssociatedFiles() returns cache files', async () => {
    // Create a cache file
    await handler.writeFile(`${rootPath}/cache.json.gz`, 'cache-content')
    await vmBackupDir.init()

    const filesWithPrefix = vmBackupDir.getAssociatedFiles({ prefix: true })
    const filesWithoutPrefix = vmBackupDir.getAssociatedFiles({ prefix: false })

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

    await VmBackupDirectory.cleanVm(handler, rootPath, { remove: true })

    const remainingFiles = await handler.list(rootPath)
    assert.ok(remainingFiles.includes('backup1.json'))
    assert.ok(remainingFiles.includes('backup1.xva'))
    assert.ok(!remainingFiles.includes('orphan.xva'))
  })

  test('Missing XVA cleans the metadata', async () => {
    await createFullBackupMetadata('metadata.json', 'missing.xva')
    await handler.unlink(`${rootPath}/missing.xva`)
    let logged = ''
    const logInfo = message => {
      logged += message + '\n'
    }
    await VmBackupDirectory.cleanVm(handler, rootPath, { remove: true, logInfo, logWarn: logInfo })
    const remainingFiles = await handler.list(rootPath)
    assert.ok(logged.match(/XVA is missing/g))
    assert.ok(!remainingFiles.includes('metadata.json'))
  })

  test('clean() preserves cache.json.gz', async () => {
    await createFullBackupMetadata('backup1.json', 'backup1.xva')
    await handler.writeFile(
      `${rootPath}/cache.json.gz`,
      await gzip(JSON.stringify({ [`/${rootPath}/backup1.json`]: {} }))
    )

    await VmBackupDirectory.cleanVm(handler, rootPath)

    const remainingFiles = await handler.list(rootPath)
    assert.equal(remainingFiles.length, 3)
    assert.ok(remainingFiles.includes('cache.json.gz'))
  })

  test('clean() removes an unreadable cache.json.gz', async () => {
    await createFullBackupMetadata('backup1.json', 'backup1.xva')
    await handler.writeFile(`${rootPath}/cache.json.gz`, 'not gzipped json')

    await VmBackupDirectory.cleanVm(handler, rootPath, { logWarn: () => {} })

    const remainingFiles = await handler.list(rootPath)
    assert.ok(!remainingFiles.includes('cache.json.gz'), 'an unreadable cache.json.gz should be removed, not kept')
  })

  test('clean() on an immutable remote never creates cache.json.gz', async () => {
    await createFullBackupMetadata('backup1.json', 'backup1.xva')
    await handler.writeFile(`${rootPath}/orphan.xva`, 'orphan-content')
    handler.isImmutable = () => true

    await VmBackupDirectory.cleanVm(handler, rootPath, { remove: true })

    const remainingFiles = await handler.list(rootPath)
    assert.ok(!remainingFiles.includes('cache.json.gz'), 'cache.json.gz should never be created on an immutable remote')
  })

  test('clean() removes a leftover cache.json.gz found on an immutable remote', async () => {
    await createFullBackupMetadata('backup1.json', 'backup1.xva')
    await handler.writeFile(`${rootPath}/cache.json.gz`, await gzip(JSON.stringify({})))
    handler.isImmutable = () => true

    await VmBackupDirectory.cleanVm(handler, rootPath)

    const remainingFiles = await handler.list(rootPath)
    assert.ok(!remainingFiles.includes('cache.json.gz'), 'erroneous cache.json.gz should be removed, not rewritten')
  })

  test('clean() removes an unreadable leftover cache.json.gz found on an immutable remote', async () => {
    await createFullBackupMetadata('backup1.json', 'backup1.xva')
    await handler.writeFile(`${rootPath}/cache.json.gz`, 'not gzipped json')
    handler.isImmutable = () => true

    await VmBackupDirectory.cleanVm(handler, rootPath)

    const remainingFiles = await handler.list(rootPath)
    assert.ok(
      !remainingFiles.includes('cache.json.gz'),
      'an unreadable cache.json.gz should be removed from an immutable remote'
    )
  })

  test('clean() tolerates an EPERM while removing the cache of an immutable remote', async () => {
    await createFullBackupMetadata('backup1.json', 'backup1.xva')
    await handler.writeFile(`${rootPath}/cache.json.gz`, await gzip(JSON.stringify({})))
    handler.isImmutable = () => true
    handler.unlink = () => {
      const error = new Error('EPERM: operation not permitted')
      error.code = 'EPERM'
      throw error
    }

    await VmBackupDirectory.cleanVm(handler, rootPath)

    const remainingFiles = await handler.list(rootPath)
    assert.ok(remainingFiles.includes('cache.json.gz'), 'the immutable cache.json.gz could not be removed')
  })

  test('clean() keeps maintaining a pre-existing cache.json.gz across a remove', async () => {
    await createFullBackupMetadata('backup1.json', 'backup1.xva')
    await createFullBackupMetadata('backup2.json', 'backup2.xva')

    // a cache with the expected number of entries: only the removal can trigger the regeneration
    const cachePath = `${rootPath}/cache.json.gz`
    await handler.writeFile(
      cachePath,
      await gzip(
        JSON.stringify({
          [`/${rootPath}/backup1.json`]: { stale: true },
          [`/${rootPath}/backup2.json`]: { stale: true },
        })
      )
    )

    // backup2 loses its XVA: its metadata will be removed by clean()
    await handler.unlink(`${rootPath}/backup2.xva`)

    await VmBackupDirectory.cleanVm(handler, rootPath, { remove: true, logInfo: () => {}, logWarn: () => {} })

    const remainingFiles = await handler.list(rootPath)
    assert.ok(remainingFiles.includes('backup1.json'))
    assert.ok(remainingFiles.includes('backup1.xva'))
    assert.ok(!remainingFiles.includes('backup2.json'), 'metadata of the backup with a missing XVA should be removed')
    assert.ok(remainingFiles.includes('cache.json.gz'), 'an existing cache.json.gz must not be dropped by a remove')

    const cache = JSON.parse((await gunzip(await handler.readFile(cachePath))).toString())
    assert.deepEqual(
      Object.keys(cache),
      [`/${rootPath}/backup1.json`],
      'cache.json.gz should have been regenerated with the surviving backup only'
    )
    assert.equal(cache[`/${rootPath}/backup1.json`].stale, undefined, 'the entry must come from the archive on disk')
  })

  test('clean() removes an orphan XVA checksum file (no matching metadata or XVA)', async () => {
    await handler.writeFile(`${rootPath}/stray.xva.checksum`, 'sha256:deadbeef')

    await VmBackupDirectory.cleanVm(handler, rootPath, { remove: true })

    const remainingFiles = await handler.list(rootPath)
    assert.ok(!remainingFiles.includes('stray.xva.checksum'), 'orphan XVA checksum should be deleted')
  })

  test('clean() keeps an XVA checksum file alongside its valid full backup', async () => {
    await createFullBackupMetadata('backup1.json', 'backup1.xva')
    await handler.writeFile(`${rootPath}/backup1.xva.checksum`, 'sha256:abc123')

    await vmBackupDir.init()
    await vmBackupDir.clean({ remove: true })

    const remainingFiles = await handler.list(rootPath)
    assert.ok(remainingFiles.includes('backup1.xva'), 'XVA should be kept')
    assert.ok(vmBackupDir.backupArchives.get(`/${rootPath}/backup1.json`).isValid)
    assert.ok(remainingFiles.includes('backup1.xva.checksum'), 'checksum should be kept')
  })
})
