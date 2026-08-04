import test from 'node:test'
import { strict as assert } from 'node:assert'
import { gunzipSync } from 'node:zlib'

import tmp from 'tmp'
import fs from 'fs-extra'
import { getHandler } from '@xen-orchestra/fs'
import { pFromCallback } from 'promise-toolbox'
import { rimraf } from 'rimraf'
// eslint-disable-next-line n/no-missing-import
import { VmBackupDirectory } from '../VmBackupDirectory.mjs'

const { beforeEach, afterEach, describe } = test

let tempDir, handler
const vmUuid = 'test-vm-uuid'
const rootPath = `xo-vm-backups/${vmUuid}`
const cachePath = `${rootPath}/cache.json.gz`

beforeEach(async () => {
  tempDir = await pFromCallback(cb => tmp.dir(cb))
  handler = getHandler({ url: `file://${tempDir}` })
  await handler.sync()
  await fs.mkdirp(`${tempDir}/${rootPath}`)
})

afterEach(async () => {
  await rimraf(tempDir)
  await handler.forget()
})

describe('readCache / writeCache', () => {
  test('writes a gzipped JSON file and reads it back', async () => {
    const data = { 'a.json': { timestamp: 1 } }
    await VmBackupDirectory.writeCache(handler, cachePath, data)

    const raw = await fs.readFile(`${tempDir}/${cachePath}`)
    // gzip magic number: the cache must not be stored as plain JSON
    assert.deepEqual(raw.subarray(0, 2), Buffer.from([0x1f, 0x8b]))
    assert.deepEqual(JSON.parse(gunzipSync(raw).toString()), data)

    assert.deepEqual(await VmBackupDirectory.readCache(handler, cachePath), data)
  })

  test('readCache returns undefined when the cache does not exist', async () => {
    assert.equal(await VmBackupDirectory.readCache(handler, cachePath), undefined)
  })

  test('readCache returns undefined when the cache is not readable', async () => {
    await handler.writeFile(cachePath, Buffer.from('not gzipped json'))
    assert.equal(await VmBackupDirectory.readCache(handler, cachePath), undefined)
  })

  test('writeCache does not throw when writing fails', async () => {
    const failing = {
      writeFile: async () => {
        throw new Error('remote is full')
      },
    }
    await VmBackupDirectory.writeCache(failing, cachePath, {})
  })
})

describe('updateCache', () => {
  test('applies the mutation on the existing cache', async () => {
    await VmBackupDirectory.writeCache(handler, cachePath, { 'a.json': { timestamp: 1 } })

    await VmBackupDirectory.updateCache(
      handler,
      cachePath,
      cache => {
        cache['b.json'] = { timestamp: 2 }
        delete cache['a.json']
      },
      { regenerate: true }
    )

    assert.deepEqual(await VmBackupDirectory.readCache(handler, cachePath), { 'b.json': { timestamp: 2 } })
  })

  // a missing cache is not an empty cache: it must never be created from a partial update
  test('does nothing when the cache does not exist and regenerate is false', async () => {
    let called = false
    await VmBackupDirectory.updateCache(
      handler,
      cachePath,
      () => {
        called = true
      },
      { regenerate: false }
    )

    assert.equal(called, false)
    assert.equal(await fs.pathExists(`${tempDir}/${cachePath}`), false)
  })

  // the cache-guard: this is the path RemoteAdapter uses, a missing cache is rebuilt from
  // the directory listing rather than left missing
  test('rebuilds a missing cache from the directory listing when regenerate is true', async () => {
    // handler.list({ prependDir: true }) returns normalized, absolute paths, and those are
    // what the cache is keyed by
    const metadataPath = `/${rootPath}/20240102T030405Z.json`
    await handler.outputFile(
      metadataPath,
      JSON.stringify({ mode: 'delta', vm: { uuid: vmUuid, is_a_template: false }, timestamp: 1 })
    )

    let called = false
    await VmBackupDirectory.updateCache(
      handler,
      cachePath,
      () => {
        called = true
      },
      { regenerate: true }
    )

    // the mutation is only ever applied to an existing cache
    assert.equal(called, false)

    const cache = await VmBackupDirectory.readCache(handler, cachePath)
    assert.deepEqual(Object.keys(cache), [metadataPath])
    assert.equal(cache[metadataPath]._filename, metadataPath)
  })

  test('leaves no cache behind when the directory does not exist', async () => {
    const missing = 'xo-vm-backups/does-not-exist/cache.json.gz'
    await VmBackupDirectory.updateCache(handler, missing, () => {}, { regenerate: true })
    assert.equal(await fs.pathExists(`${tempDir}/${missing}`), false)
  })
})
