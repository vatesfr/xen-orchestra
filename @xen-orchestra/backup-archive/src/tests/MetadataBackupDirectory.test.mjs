import test from 'node:test'
import { strict as assert } from 'node:assert'

// eslint-disable-next-line n/no-missing-import
import { deleteMetadataBackup, deleteOldMetadataBackups } from '../../dist/MetadataBackupDirectory.mjs'

const { describe } = test

const UUID = '05782c6b-8fbf-4b4f-9d7a-c1a0e0ba0a5f'
const OTHER_UUID = '1a2b3c4d-8fbf-4b4f-9d7a-c1a0e0ba0a5f'

// records the paths passed to rmtree, and the directory listing to serve
const makeHandler = (list = []) => {
  const removed = []
  return {
    removed,
    list: async () => list,
    rmtree: async path => {
      removed.push(path)
    },
  }
}

describe('deleteMetadataBackup', () => {
  for (const id of [
    `xo-config-backups/${UUID}/20240102T030405Z`,
    `xo-pool-metadata-backups/${UUID}/${OTHER_UUID}/20240102T030405Z`,
  ]) {
    test(`deletes ${id}`, async () => {
      const handler = makeHandler()
      await deleteMetadataBackup(handler, id)
      assert.deepEqual(handler.removed, [id])
    })
  }

  for (const id of [
    `xo-vm-backups/${UUID}/20240102T030405Z`, // not a metadata directory
    `xo-config-backups/${UUID}`, // no timestamp
    `xo-config-backups/20240102T030405Z`, // no uuid
    '',
  ]) {
    test(`rejects ${JSON.stringify(id)} without deleting anything`, async () => {
      const handler = makeHandler()
      await assert.rejects(deleteMetadataBackup(handler, id), {
        message: `The id (${id}) not correspond to a metadata folder`,
      })
      assert.deepEqual(handler.removed, [])
    })
  }
})

describe('deleteOldMetadataBackups', () => {
  const TIMESTAMPS = [
    '20240102T030401Z',
    '20240102T030402Z',
    '20240102T030403Z',
    '20240102T030404Z',
    '20240102T030405Z',
  ]
  const dir = `xo-config-backups/${UUID}`

  test('keeps the `retention` most recent backups', async () => {
    const handler = makeHandler([...TIMESTAMPS].reverse())
    await deleteOldMetadataBackups(handler, dir, 2)
    assert.deepEqual(handler.removed, [`${dir}/20240102T030401Z`, `${dir}/20240102T030402Z`, `${dir}/20240102T030403Z`])
  })

  test('ignores entries which are not backup directories', async () => {
    const handler = makeHandler([...TIMESTAMPS, 'not-a-backup', '.hidden'])
    await deleteOldMetadataBackups(handler, dir, 4)
    assert.deepEqual(handler.removed, [`${dir}/20240102T030401Z`])
  })

  test('deletes nothing when there are fewer backups than the retention', async () => {
    const handler = makeHandler(TIMESTAMPS.slice(0, 2))
    await deleteOldMetadataBackups(handler, dir, 5)
    assert.deepEqual(handler.removed, [])
  })
})
