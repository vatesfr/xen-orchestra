import test from 'node:test'
import { strict as assert } from 'node:assert'

// eslint-disable-next-line n/no-missing-import
import { VmBackupDirectory } from '../../dist/VmBackupDirectory.mjs'

const { describe } = test

describe('removeBackupsFromCache', () => {
  test('updates each cache file once and only deletes the listed backups', async () => {
    const calls = []
    const updateCache = async (path, fn) => {
      calls.push({ path, fn })
    }

    await VmBackupDirectory.removeBackupsFromCache(updateCache, [
      { _filename: 'xo-vm-backups/vm1/a.json' },
      { _filename: 'xo-vm-backups/vm1/b.json' },
      { _filename: 'xo-vm-backups/vm2/c.json' },
    ])

    // one write per directory, not per backup
    assert.deepEqual(
      calls.map(({ path }) => path),
      ['xo-vm-backups/vm1/cache.json.gz', 'xo-vm-backups/vm2/cache.json.gz']
    )

    const vm1Cache = {
      'xo-vm-backups/vm1/a.json': {},
      'xo-vm-backups/vm1/b.json': {},
      'xo-vm-backups/vm1/keep.json': {},
    }
    calls[0].fn(vm1Cache)
    assert.deepEqual(Object.keys(vm1Cache), ['xo-vm-backups/vm1/keep.json'])

    const vm2Cache = { 'xo-vm-backups/vm2/c.json': {}, 'xo-vm-backups/vm2/keep.json': {} }
    calls[1].fn(vm2Cache)
    assert.deepEqual(Object.keys(vm2Cache), ['xo-vm-backups/vm2/keep.json'])
  })

  test('does not update anything when there is no backup', async () => {
    let called = false
    await VmBackupDirectory.removeBackupsFromCache(async () => {
      called = true
    }, [])
    assert.equal(called, false)
  })
})

describe('listVmBackups', () => {
  const CACHED = {
    'b.json': { _filename: 'b.json', timestamp: 20, mode: 'delta' },
    'a.json': { _filename: 'a.json', timestamp: 10, mode: 'full' },
    'c.json': { _filename: 'c.json', timestamp: 30, mode: 'delta' },
  }

  test('sorts by ascending timestamp', async () => {
    const backups = await VmBackupDirectory.listVmBackups(async () => CACHED, 'vm-uuid')
    assert.deepEqual(
      backups.map(({ timestamp }) => timestamp),
      [10, 20, 30]
    )
  })

  test('applies the predicate', async () => {
    const backups = await VmBackupDirectory.listVmBackups(
      async () => CACHED,
      'vm-uuid',
      ({ mode }) => mode === 'delta'
    )
    assert.deepEqual(
      backups.map(({ _filename }) => _filename),
      ['b.json', 'c.json']
    )
  })

  test('returns an empty list when there is no cacheable data', async () => {
    assert.deepEqual(await VmBackupDirectory.listVmBackups(async () => undefined, 'vm-uuid'), [])
  })
})

describe('deleteVmBackups', () => {
  test('throws on a backup mode it cannot delete, before cleaning anything', async () => {
    const handler = {
      _readFile: async () => {
        const error = new Error('ENOENT')
        error.code = 'ENOENT'
        throw error
      },
      readFile: async () => JSON.stringify({ mode: 'weird', vm: { is_a_template: false } }),
    }
    let cleanVmCalled = false

    await assert.rejects(
      VmBackupDirectory.deleteVmBackups(handler, ['xo-vm-backups/vm1/a.json'], {
        updateCache: async () => {},
        cleanVm: async () => {
          cleanVmCalled = true
        },
      }),
      { message: 'no deleter for backup modes: weird' }
    )
    assert.equal(cleanVmCalled, false)
  })
})

// the recursion over the vmUuid -> backups map is covered end to end by
// `getTotalVmBackupSize` in VmBackupDirectoryList.integ.mjs
describe('computeTotalBackupSizeRecursively', () => {
  test('sums `onDisk`, falling back to `size`', () => {
    assert.deepEqual(
      VmBackupDirectory.computeTotalBackupSizeRecursively([
        { size: 1, onDisk: 10 }, // onDisk wins over size
        { size: 100 }, // no onDisk => size
        { size: 1000, onDisk: 0 }, // onDisk 0 is a value, not a missing one
      ]),
      { onDisk: 110 }
    )
  })
})
