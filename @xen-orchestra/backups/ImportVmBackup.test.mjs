import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import pickBy from 'lodash/pickBy.js'

import { ImportVmBackup } from './ImportVmBackup.mjs'

const VM_UUID = 'vm-uuid'
const JOB_ID = 'job-id'
const DEFAULT_SR = 'default-sr-uuid'
const OTHER_SR = 'other-sr-uuid'
const HOST = 'host-uuid'

// two disks, each identified in the backup by the uuid of the snapshot it was taken from
const SYSTEM = { ref: 'OpaqueRef:system', uuid: 'snapshot-vdi-system', liveUuid: 'live-vdi-system' }
const DATA = { ref: 'OpaqueRef:data', uuid: 'snapshot-vdi-data', liveUuid: 'live-vdi-data' }

const metadataFilename = `/xo-vm-backups/${VM_UUID}/20250801T080832Z.json`

const vhdPath = disk => `vdis/${JOB_ID}/${disk.liveUuid}/20250801T080832Z.vhd`

function makeMetadata() {
  return {
    _filename: metadataFilename,
    jobId: JOB_ID,
    mode: 'delta',
    timestamp: 1754035712000,
    vbds: {},
    vdis: {
      // `SR` is the ref the VDI had on the pool the backup was taken from
      [SYSTEM.ref]: { uuid: SYSTEM.uuid, $snapshot_of$uuid: SYSTEM.liveUuid, name_label: 'system', SR: 'OpaqueRef:sr' },
      [DATA.ref]: { uuid: DATA.uuid, $snapshot_of$uuid: DATA.liveUuid, name_label: 'data', SR: 'OpaqueRef:sr' },
    },
    vhds: {
      [SYSTEM.ref]: vhdPath(SYSTEM),
      [DATA.ref]: vhdPath(DATA),
    },
    vifs: {},
    vm: { uuid: VM_UUID, name_label: 'a vm', tags: [] },
    vmSnapshot: { suspend_VDI: 'OpaqueRef:NULL' },
    vtpms: [],
  }
}

// mimics `RemoteAdapter#readIncrementalVmBackup`: excluded VDIs are dropped, the others get a disk
function makeAdapter(metadata) {
  return {
    _handler: {},
    readIncrementalVmBackup(_metadata, excludedVdiUuids) {
      const vdis = pickBy(metadata.vdis, vdi => !excludedVdiUuids.has(vdi.uuid))
      const disks = {}
      for (const ref of Object.keys(vdis)) {
        disks[ref] = { path: metadata.vhds[ref] }
      }
      return { disks, vbds: metadata.vbds, vdis, version: '1.0.0', vifs: {}, vm: metadata.vm, vtpms: [] }
    },
  }
}

const makeXapi = () => ({
  call(method, uuid) {
    const [type, getter] = method.split('.')
    assert.equal(getter, 'get_by_uuid')
    return `${type}_REF:${uuid}`
  },
})

function makeLiveMount() {
  const mounted = []
  return {
    mounted,
    unmounted: [],
    mountDisk(params) {
      mounted.push(params)
      return { id: `mount-${mounted.length}`, vdiUuid: `mounted-vdi-${mounted.length}` }
    },
    unmountDisk(id) {
      this.unmounted.push(id)
    },
  }
}

function makeImporter({ mapVdisSrs, useDifferentialRestore = false, withoutLiveMount = false } = {}) {
  const liveMount = withoutLiveMount ? undefined : makeLiveMount()
  const metadata = makeMetadata()
  const importer = new ImportVmBackup({
    adapter: makeAdapter(metadata),
    liveMount,
    metadata,
    settings: { mapVdisSrs, useDifferentialRestore },
    srUuid: DEFAULT_SR,
    xapi: makeXapi(),
  })
  return { importer, liveMount, metadata }
}

describe('ImportVmBackup#_decorateIncrementalVmMetadata()', () => {
  it('restores every disk onto the default SR when nothing is mapped', async () => {
    const { importer } = makeImporter()

    const backup = await importer._decorateIncrementalVmMetadata()

    assert.deepEqual(Object.keys(backup.vdis), [SYSTEM.ref, DATA.ref])
    for (const vdi of Object.values(backup.vdis)) {
      assert.equal(vdi.SR, `SR_REF:${DEFAULT_SR}`)
    }
  })

  it('honors a per disk SR, in both the legacy and the current shape', async () => {
    for (const mapVdisSrs of [{ [DATA.uuid]: OTHER_SR }, { [DATA.uuid]: { type: 'restore', sr: OTHER_SR } }]) {
      const { importer } = makeImporter({ mapVdisSrs })

      const backup = await importer._decorateIncrementalVmMetadata()

      assert.equal(backup.vdis[SYSTEM.ref].SR, `SR_REF:${DEFAULT_SR}`)
      assert.equal(backup.vdis[DATA.ref].SR, `SR_REF:${OTHER_SR}`)
    }
  })

  it('leaves out an ignored disk, in both the legacy and the current shape', async () => {
    for (const mapVdisSrs of [{ [DATA.uuid]: null }, { [DATA.uuid]: { type: 'ignore' } }]) {
      const { importer } = makeImporter({ mapVdisSrs })

      const backup = await importer._decorateIncrementalVmMetadata()

      assert.deepEqual(Object.keys(backup.vdis), [SYSTEM.ref])
      assert.deepEqual(Object.keys(backup.disks), [SYSTEM.ref])
    }
  })

  describe('live mount', () => {
    const mapVdisSrs = { [DATA.uuid]: { type: 'live-mount', host: HOST } }

    it('mounts the disk instead of reading it', async () => {
      const { importer, liveMount } = makeImporter({ mapVdisSrs })

      const backup = await importer._decorateIncrementalVmMetadata()

      assert.deepEqual(liveMount.mounted, [{ diskPath: `/xo-vm-backups/${VM_UUID}/${vhdPath(DATA)}`, hostId: HOST }])
      // no data is transferred for it
      assert.deepEqual(Object.keys(backup.disks), [SYSTEM.ref])
    })

    it('attaches the mounted VDI and gives it no SR', async () => {
      const { importer } = makeImporter({ mapVdisSrs })

      const backup = await importer._decorateIncrementalVmMetadata()

      const vdi = backup.vdis[DATA.ref]
      assert.equal(vdi.liveMountedVdiRef, 'VDI_REF:mounted-vdi-1')
      assert.equal(vdi.SR, undefined)
      assert.equal(vdi.uuid, DATA.uuid)
      // the other disk is restored as usual
      assert.equal(backup.vdis[SYSTEM.ref].SR, `SR_REF:${DEFAULT_SR}`)
      assert.equal(backup.vdis[SYSTEM.ref].liveMountedVdiRef, undefined)
    })

    it('rejects live mounts spread over several hosts', async () => {
      const { importer } = makeImporter({
        mapVdisSrs: {
          [SYSTEM.uuid]: { type: 'live-mount', host: HOST },
          [DATA.uuid]: { type: 'live-mount', host: 'another-host' },
        },
      })

      await assert.rejects(() => importer._decorateIncrementalVmMetadata(), /must use the same host/)
    })

    it('rejects a live mount when the caller cannot serve one', async () => {
      const { importer } = makeImporter({ mapVdisSrs, withoutLiveMount: true })

      await assert.rejects(() => importer._decorateIncrementalVmMetadata(), /not supported here/)
    })
  })
})

describe('ImportVmBackup#_reuseNearestSnapshot()', () => {
  // a snapshot whose backup is the very file being restored: `_reuseNearestSnapshot` reuses it as
  // is, which is the one branch that opens no VHD chain
  function makeDifferentialImporter({ mapVdisSrs, snapshotSrUuid }) {
    const metadata = makeMetadata()
    const adapter = makeAdapter(metadata)
    adapter.listVmBackups = () => [{ vdis: metadata.vdis, vhds: metadata.vhds }]
    // reusing a snapshot as is opens nothing: any attempt to open the backup chain means the disk
    // is about to be transferred instead
    adapter._handler = {
      openFile() {
        throw new Error('would transfer the disk')
      },
    }

    const snapshots = {
      'OpaqueRef:snapshot': {
        uuid: DATA.uuid,
        type: 'user',
        snapshot_time: 1,
        $SR: { uuid: snapshotSrUuid },
      },
    }

    const xapi = {
      ...makeXapi(),
      getRecordByUuid(type, uuid) {
        assert.equal(type, 'VDI')
        return uuid === DATA.liveUuid ? { snapshots: Object.keys(snapshots) } : undefined
      },
      getRecord(type, ref) {
        assert.equal(type, 'VDI')
        return snapshots[ref]
      },
    }

    return new ImportVmBackup({
      adapter,
      metadata,
      settings: { mapVdisSrs, useDifferentialRestore: true },
      srUuid: DEFAULT_SR,
      xapi,
    })
  }

  it('reuses a snapshot sitting on the SR that disk is restored to', async () => {
    // the disk is remapped to another SR, and the snapshot is there too
    const importer = makeDifferentialImporter({
      mapVdisSrs: { [DATA.uuid]: OTHER_SR, [SYSTEM.uuid]: null },
      snapshotSrUuid: OTHER_SR,
    })

    const backup = await importer._reuseNearestSnapshot(new Set([SYSTEM.uuid]))

    assert.equal(backup.vdis[DATA.ref].baseVdi.uuid, DATA.uuid)
    assert.equal(backup.disks[DATA.ref], undefined)
  })

  it('skips a snapshot sitting on another SR', async () => {
    // the snapshot is on the default SR, but that disk is restored to another one: cloning it
    // would land on the wrong SR, so it must be transferred instead
    const importer = makeDifferentialImporter({
      mapVdisSrs: { [DATA.uuid]: OTHER_SR, [SYSTEM.uuid]: null },
      snapshotSrUuid: DEFAULT_SR,
    })

    await assert.rejects(() => importer._reuseNearestSnapshot(new Set([SYSTEM.uuid])), /would transfer the disk/)
  })
})
