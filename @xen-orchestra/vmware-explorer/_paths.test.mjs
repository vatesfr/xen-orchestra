import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { normalizeDatastorePath, resolveDiskLocation } from './_paths.mjs'

describe('normalizeDatastorePath', function () {
  it('drops the ds:// scheme and the trailing slashes', function () {
    assert.equal(normalizeDatastorePath('ds:///vmfs/volumes/uuid-1/'), '/vmfs/volumes/uuid-1')
    assert.equal(normalizeDatastorePath('/vmfs/volumes/uuid-1'), '/vmfs/volumes/uuid-1')
    assert.equal(normalizeDatastorePath('/vmfs/volumes/uuid-1///'), '/vmfs/volumes/uuid-1')
  })
})

describe('resolveDiskLocation', function () {
  const dataStores = {
    '/vmfs/volumes/uuid-1': { name: 'ds main' },
    'ds:///vmfs/volumes/uuid-2/': { name: 'ds vsan' },
  }
  const relative = { dataStores, currentDataStore: 'ds main', currentPath: 'vm' }

  it('resolves a reference relative to the directory of the vmx', function () {
    assert.deepEqual(resolveDiskLocation({ ...relative, filePath: 'vm-000001.vmdk' }), {
      dataStore: 'ds main',
      path: 'vm/vm-000001.vmdk',
    })
  })

  it('finds the datastore of an absolute reference', function () {
    assert.deepEqual(resolveDiskLocation({ ...relative, filePath: '/vmfs/volumes/uuid-1/other/disk.vmdk' }), {
      dataStore: 'ds main',
      path: 'other/disk.vmdk',
    })
  })

  it('compares normalized paths on both sides', function () {
    // a vCenter url against a host path, and the other way around
    assert.deepEqual(resolveDiskLocation({ ...relative, filePath: '/vmfs/volumes/uuid-2/vm/disk.vmdk' }), {
      dataStore: 'ds vsan',
      path: 'vm/disk.vmdk',
    })
    assert.deepEqual(resolveDiskLocation({ ...relative, filePath: 'ds:///vmfs/volumes/uuid-1/vm/disk.vmdk' }), {
      dataStore: 'ds main',
      path: 'vm/disk.vmdk',
    })
  })

  it('does not match a datastore whose url is a prefix of the directory name', function () {
    // `/vmfs/volumes/uuid-10` must not be resolved to the datastore `/vmfs/volumes/uuid-1`
    assert.throws(() => resolveDiskLocation({ ...relative, filePath: '/vmfs/volumes/uuid-10/vm/disk.vmdk' }), {
      code: 'DATASTORE_NOT_FOUND',
    })
  })

  it('skips a datastore whose url is empty', function () {
    // an empty prefix matches every absolute path: listed first, it used to shadow every real
    // datastore
    const withEmpty = {
      dataStores: { '': { name: 'ds unmounted' }, 'ds:///': { name: 'ds unmounted too' }, ...dataStores },
      currentDataStore: 'ds main',
      currentPath: 'vm',
    }
    assert.deepEqual(resolveDiskLocation({ ...withEmpty, filePath: '/vmfs/volumes/uuid-1/other/disk.vmdk' }), {
      dataStore: 'ds main',
      path: 'other/disk.vmdk',
    })
  })

  it('reports an absolute reference on no known datastore', function () {
    assert.throws(
      () => resolveDiskLocation({ ...relative, filePath: '/vmfs/volumes/uuid-3/vm/disk.vmdk' }),
      error => {
        assert.equal(error.code, 'DATASTORE_NOT_FOUND')
        assert.equal(error.filePath, '/vmfs/volumes/uuid-3/vm/disk.vmdk')
        assert.deepEqual(error.dataStoreUrls, ['/vmfs/volumes/uuid-1', 'ds:///vmfs/volumes/uuid-2/'])
        return true
      }
    )
  })
})
