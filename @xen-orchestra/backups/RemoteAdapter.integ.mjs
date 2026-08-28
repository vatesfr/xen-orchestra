import test from 'node:test'
import { strict as assert } from 'node:assert'

import tmp from 'tmp'
import * as uuid from 'uuid'
import { getHandler } from '@xen-orchestra/fs'
import { pFromCallback } from 'promise-toolbox'
import { rimraf } from 'rimraf'

import { RemoteAdapter } from './RemoteAdapter.mjs'
import { formatFilenameDate } from './_filenameDate.mjs'

const { beforeEach, afterEach, describe } = test

const vmUuid = 'a1b2c3d4-0000-0000-0000-000000000000'
const rootPath = `xo-vm-backups/${vmUuid}`

let tempDir, adapter, handler

beforeEach(async () => {
  tempDir = await pFromCallback(cb => tmp.dir(cb))
  handler = getHandler({ url: `file://${tempDir}` })
  await handler.sync()
  adapter = new RemoteAdapter(handler)
})

afterEach(async () => {
  await rimraf(tempDir)
  await handler.forget()
})

const listVmDir = () => handler.list(rootPath, { ignoreMissing: true })

// write a full backup the way a backup job would, i.e. through the adapter
function writeFullBackup(timestamp = Date.now()) {
  return adapter.writeVmBackupMetadata(vmUuid, {
    mode: 'full',
    xva: `./${formatFilenameDate(timestamp)}.xva`,
    vm: { uuid: vmUuid },
    jobId: uuid.v1(),
    scheduleId: uuid.v1(),
    timestamp,
  })
}

describe('cache.json.gz on an immutable remote', { concurrency: 1 }, () => {
  test('writing a backup does not create it', async () => {
    handler.isImmutable = () => true

    await writeFullBackup()

    assert.ok(
      !(await listVmDir()).includes('cache.json.gz'),
      'cache.json.gz must never be created on an immutable remote'
    )
  })

  // deleteFullVmBackups() rather than deleteVmBackup(), because the latter also runs cleanVm()
  // which removes a leftover cache and would hide a cache wrongly written by the deletion itself
  test('deleting a backup does not create it', async () => {
    handler.isImmutable = () => true
    await writeFullBackup()
    const backups = await adapter.listVmBackups(vmUuid)
    assert.equal(backups.length, 1)

    await adapter.deleteFullVmBackups(backups)

    assert.ok(
      !(await listVmDir()).includes('cache.json.gz'),
      'cache.json.gz must never be created on an immutable remote'
    )
  })

  test('it is still created on a mutable remote', async () => {
    await writeFullBackup()

    assert.ok((await listVmDir()).includes('cache.json.gz'), 'a mutable remote must keep using the cache')
  })
})
