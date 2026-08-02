import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { EventEmitter } from 'node:events'

import LiveMount from './index.mjs'

const SCSI_ID = '1VATES_xo-backup-db4582d0c901d31379ac5eb5deea9a68'
const DISK_SIZE = 2 * 1024 * 1024 * 1024

// as reported by a real host, trailing space included
const LUN_LIST_XML = `<?xml version="1.0" ?>
<iscsi-target>
  <LUN>
    <vendor>VATES</vendor>
    <LUNid>0</LUNid>
    <size>2147483648</size>
    <SCSIid>${SCSI_ID} </SCSIid>
  </LUN>
</iscsi-target>`

const HOST_REF = 'OpaqueRef:host'
const SR_REF = 'OpaqueRef:sr'

class XapiError extends Error {
  constructor(code, params) {
    super(code)
    this.code = code
    this.params = params
  }
}

const CACHE_SR_REF = 'OpaqueRef:cache-sr'
const CACHE_VDI_REF = 'OpaqueRef:cache-vdi'
const CACHE_VBD_REF = 'OpaqueRef:cache-vbd'
const VM_REF = 'OpaqueRef:vm'

const makeXapi = ({ probeError, vdiSmConfig, cacheDevice = 'xvdb' } = {}) => {
  const calls = []
  return {
    calls,
    async call(method, ...args) {
      calls.push([method, ...args])
      switch (method) {
        case 'SR.probe':
          throw probeError ?? new XapiError('SR_BACKEND_FAILURE_107', ['', '', LUN_LIST_XML])
        case 'SR.introduce':
          return SR_REF
        case 'PBD.create':
          return 'OpaqueRef:pbd'
        case 'SR.get_VDIs':
          return ['OpaqueRef:vdi']
        case 'SR.get_PBDs':
          return ['OpaqueRef:pbd']
        default:
          return undefined
      }
    },
    async setFieldEntry(...args) {
      calls.push(['setFieldEntry', ...args])
    },
    async getField(type, ref, field) {
      calls.push(['getField', type, ref, field])
      if (type === 'VBD' && field === 'device') {
        return cacheDevice
      }
      if (type === 'VDI' && field === 'uuid') {
        return 'cache-vdi-uuid'
      }
      return 'sr-uuid'
    },
    async getRecord(type, ref) {
      calls.push(['getRecord', type, ref])
      // the driver derives the VDI uuid from the LUN serial, so it differs from
      // the one we asked for
      return { uuid: 'vdi-uuid', sm_config: vdiSmConfig ?? { SCSIid: SCSI_ID } }
    },
    async VDI_create(params) {
      calls.push(['VDI_create', params])
      return CACHE_VDI_REF
    },
    async VBD_create(params) {
      calls.push(['VBD_create', params])
      return CACHE_VBD_REF
    },
    async VBD_destroy(ref) {
      calls.push(['VBD_destroy', ref])
    },
    async VDI_destroy(ref) {
      calls.push(['VDI_destroy', ref])
    },
  }
}

/** In-memory stand-in for the plugged cache device. */
const makeCacheDevice = size => {
  const content = Buffer.alloc(size)
  return {
    closed: false,
    content,
    getSize: () => size,
    getBlockSize: () => 512,
    read: async (offset, length) => Buffer.from(content.subarray(offset, offset + length)),
    write: async (offset, data) => {
      data.copy(content, offset)
    },
    flush: async () => {},
    close: async function () {
      this.closed = true
    },
  }
}

const makeMixin = ({ diskOpenError, listenError, openCacheError } = {}) => {
  const hooks = new EventEmitter()
  const app = {
    config: {
      get: path => {
        assert.equal(path, 'iscsi.advertisedAddress')
        return '192.168.1.8'
      },
      getOptional: () => undefined,
    },
    hooks,
  }

  const disk = {
    closed: false,
    close: async () => (disk.closed = true),
    getBlockSize: () => 2 * 1024 * 1024, // as a VHD chain would report
    getVirtualSize: () => DISK_SIZE,
  }
  const target = {
    closed: false,
    options: undefined,
    address: () => ({ port: 34567 }),
    listen: async () => {
      if (listenError !== undefined) {
        throw listenError
      }
      // the real target opens the LUN, which is what exposes its capacity
      await target.options.lun.open()
    },
    close: async () => (target.closed = true),
  }

  const cache = makeCacheDevice(DISK_SIZE)

  const mixin = new LiveMount(app, {
    openDisk: async params => {
      if (diskOpenError !== undefined) {
        throw diskOpenError
      }
      disk.params = params
      return disk
    },
    createTarget: options => {
      target.options = options
      return target
    },
    openCache: async params => {
      if (openCacheError !== undefined) {
        throw openCacheError
      }
      cache.params = params
      return cache
    },
  })

  return { app, cache, disk, hooks, mixin, target }
}

const mount = (mixin, xapi, params) =>
  mixin.mountDisk({
    cache: { srRef: CACHE_SR_REF, vmRef: VM_REF },
    diskPath: 'xo-vm-backups/vm/vdis/job/vdi/20260731T120000Z.alias.vhd',
    hostRef: HOST_REF,
    xapi,
    ...params,
  })

describe('mount', () => {
  it('serves the chain and attaches it as a non-shared iscsi SR on the host', async () => {
    const { mixin, target, disk, cache } = makeMixin()
    const xapi = makeXapi()

    const result = await mount(mixin, xapi)

    // the SR uuid is ours, since we introduce the SR instead of creating it
    assert.equal(result.srUuid, xapi.calls.find(([method]) => method === 'SR.introduce')[1])
    assert.match(result.srUuid, /^[0-9a-f-]{36}$/)
    assert.equal(result.vdiUuid, 'vdi-uuid')
    assert.equal(result.address, '192.168.1.8')
    assert.equal(result.port, 34567)
    assert.match(result.iqn, /^iqn\.2026-07\.tech\.vates\.xo:live-mount-[0-9a-f]{32}$/)

    // the chain is opened with its block allocation tables
    assert.equal(disk.params.path, 'xo-vm-backups/vm/vdis/job/vdi/20260731T120000Z.alias.vhd')
    assert.equal(disk.params.ignoreBlockIndexes, undefined)

    // one ephemeral target per mount, CHAP enabled, unique serial
    assert.equal(target.options.port, 0)
    assert.equal(target.options.iqn, result.iqn)
    assert.equal(target.options.chap.secret.length, 16)
    assert.equal(target.options.identity.serial, `xo-live-mount-${result.id}`)

    // introduced, not created: SR.create would scan and introduce the VDI itself
    const srIntroduce = xapi.calls.find(([method]) => method === 'SR.introduce')
    assert.equal(srIntroduce[4], 'iscsi') // type
    assert.equal(srIntroduce[6], false) // shared
    assert.ok(!xapi.calls.some(([method]) => method === 'SR.create'))

    // the cache disk is created on the given SR at the disk's full size, and
    // plugged into *this* appliance
    const vdiCreate = xapi.calls.find(([method]) => method === 'VDI_create')[1]
    assert.equal(vdiCreate.SR, CACHE_SR_REF)
    assert.equal(vdiCreate.virtual_size, DISK_SIZE)
    assert.equal(vdiCreate.name_label, '20260731T120000Z.raw')
    const vbdCreate = xapi.calls.find(([method]) => method === 'VBD_create')[1]
    assert.equal(vbdCreate.VM, VM_REF)
    assert.equal(vbdCreate.VDI, CACHE_VDI_REF)
    assert.equal(vbdCreate.mode, 'RW')
    // without this, VBD_create only warns when the plug fails
    assert.equal(vbdCreate.throwVbdPlug, true)
    // the device name is read back after the plug, XAPI assigns it
    assert.deepEqual(cache.params, { name: 'xvdb', size: DISK_SIZE })

    // the PBD is created on the requested host
    const pbdCreate = xapi.calls.find(([method]) => method === 'PBD.create')[1]
    assert.equal(pbdCreate.host, HOST_REF)
    assert.equal(pbdCreate.SR, SR_REF)
    assert.deepEqual(pbdCreate.device_config, {
      SCSIid: SCSI_ID,
      chapuser: target.options.chap.user,
      chappassword: target.options.chap.secret,
      port: '34567',
      target: '192.168.1.8',
      targetIQN: result.iqn,
    })
    assert.ok(xapi.calls.some(([method, ref]) => method === 'PBD.plug' && ref === 'OpaqueRef:pbd'))

    // the VDI is introduced by us: read_only and sm_config are settable only here
    const vdiIntroduce = xapi.calls.find(([method]) => method === 'VDI.introduce')
    assert.equal(vdiIntroduce[4], SR_REF)
    assert.equal(vdiIntroduce[5], 'user')
    assert.equal(vdiIntroduce[7], false) // read_only: writes land in the cache
    // `type` is the legacy key the sm drivers still accept:
    // `vdi_sm_config.get("image-format") or vdi_sm_config.get("type")`
    assert.deepEqual(vdiIntroduce[11], { LUNid: '0', SCSIid: SCSI_ID, type: 'raw' })
    assert.equal(vdiIntroduce[12], true) // managed
    assert.equal(vdiIntroduce[13], DISK_SIZE) // virtual size, from the LUN

    // probe uses lvmoiscsi and does not name a SCSIid yet
    const probe = xapi.calls.find(([method]) => method === 'SR.probe')
    assert.equal(probe[3], 'lvmoiscsi')
    assert.equal(probe[2].SCSIid, undefined)

    // ephemeral SR: tagged and not scanned at boot
    assert.deepEqual(
      xapi.calls.filter(([method]) => method === 'setFieldEntry').map(([, , , , entry, value]) => [entry, value]),
      [
        ['xo:live-mount', result.id],
        ['auto-scan', 'false'],
      ]
    )
    // VDI.read_only is StaticRO in XAPI: nothing may try to set it
    assert.ok(!xapi.calls.some(([method]) => method === 'VDI.set_read_only'))

    assert.deepEqual(
      mixin.listMountedDisks().map(({ id, srUuid, vdiUuid, cacheVdiUuid, materialized }) => ({
        id,
        srUuid,
        vdiUuid,
        cacheVdiUuid,
        materialized,
      })),
      [
        {
          id: result.id,
          srUuid: result.srUuid,
          vdiUuid: 'vdi-uuid',
          cacheVdiUuid: 'cache-vdi-uuid',
          // nothing read yet: 2 MiB blocks over the disk
          materialized: { blocks: 0, total: DISK_SIZE / (2 * 1024 * 1024) },
        },
      ]
    )
  })

  it('serves reads from the cache once the source has been read', async () => {
    const { mixin, target, cache, disk } = makeMixin()
    const readBlocks = []
    disk.hasBlock = () => true
    disk.readBlock = async index => {
      readBlocks.push(index)
      return { index, data: Buffer.alloc(2 * 1024 * 1024, 0xab) }
    }

    await mount(mixin, makeXapi())
    const lun = target.options.lun

    assert.deepEqual(await lun.read(0, 512), Buffer.alloc(512, 0xab))
    assert.deepEqual(readBlocks, [0])
    // it landed in the cache disk...
    assert.deepEqual(cache.content.subarray(0, 512), Buffer.alloc(512, 0xab))
    // ... so a second read does not touch the source again
    assert.deepEqual(await lun.read(1024, 512), Buffer.alloc(512, 0xab))
    assert.deepEqual(readBlocks, [0])
    assert.deepEqual(mixin.listMountedDisks()[0].materialized, { blocks: 1, total: DISK_SIZE / (2 * 1024 * 1024) })
  })

  it('closes the cache device when the probe fails', async () => {
    const { mixin, cache, disk, target } = makeMixin()
    const xapi = makeXapi({ probeError: new XapiError('SR_BACKEND_FAILURE_666', []) })

    await assert.rejects(mount(mixin, xapi), { code: 'SR_BACKEND_FAILURE_666' })

    assert.equal(cache.closed, true)
    assert.equal(target.closed, true)
    assert.equal(disk.closed, true)
    // and the cache disk is taken away again
    assert.deepEqual(
      xapi.calls.filter(([method]) => method.endsWith('_destroy')),
      [
        ['VBD_destroy', CACHE_VBD_REF],
        ['VDI_destroy', CACHE_VDI_REF],
      ]
    )
  })

  it('destroys the cache disk when it cannot be opened', async () => {
    const { mixin, disk } = makeMixin({ openCacheError: new Error('ENOENT /dev/xvdb') })
    const xapi = makeXapi()

    await assert.rejects(mount(mixin, xapi), /ENOENT/)

    assert.equal(disk.closed, true)
    assert.deepEqual(
      xapi.calls.filter(([method]) => method.endsWith('_destroy')),
      [
        ['VBD_destroy', CACHE_VBD_REF],
        ['VDI_destroy', CACHE_VDI_REF],
      ]
    )
  })

  it('fails when XAPI assigns no device to the cache disk', async () => {
    const { mixin } = makeMixin()
    await assert.rejects(mount(mixin, makeXapi({ cacheDevice: '' })), /did not assign a device/)
  })

  it('reports an unreachable target as a configuration problem', async () => {
    const { mixin } = makeMixin()
    const xapi = makeXapi({ probeError: new XapiError('SR_BACKEND_FAILURE_141', []) })

    await assert.rejects(mount(mixin, xapi), /cannot reach the iSCSI target at 192\.168\.1\.8/)
  })

  it('closes the disk when the target cannot listen', async () => {
    const { mixin, disk } = makeMixin({ listenError: new Error('EADDRINUSE') })

    await assert.rejects(mount(mixin, makeXapi()), /EADDRINUSE/)

    assert.equal(disk.closed, true)
  })

  it('mounts without a cache: no local disk, read-only, works on any host', async () => {
    const { mixin, target, disk } = makeMixin()
    const xapi = makeXapi()
    const otherHostRef = 'OpaqueRef:some-other-host'

    const result = await mount(mixin, xapi, { cache: undefined, hostRef: otherHostRef })

    // no cache disk at all
    assert.ok(!xapi.calls.some(([method]) => method === 'VDI_create'))
    assert.ok(!xapi.calls.some(([method]) => method === 'VBD_create'))
    assert.equal(result.cacheVdiUuid, undefined)

    // the LUN is served straight from the source, on whichever host was asked
    const pbdCreate = xapi.calls.find(([method]) => method === 'PBD.create')[1]
    assert.equal(pbdCreate.host, otherHostRef)

    // states the read-only intent, even though the driver itself ignores it
    const vdiIntroduce = xapi.calls.find(([method]) => method === 'VDI.introduce')
    assert.equal(vdiIntroduce[7], true) // read_only

    // the LUN really is read-only: no local store to fall back on
    await assert.rejects(target.options.lun.write(0, Buffer.alloc(512)), /read-only/)

    // an uncached mount has nothing to report progress on
    assert.equal(mixin.listMountedDisks()[0].materialized, undefined)

    // and reads still go straight to the source
    disk.hasBlock = () => true
    disk.readBlock = async index => ({ index, data: Buffer.alloc(2 * 1024 * 1024, 0xcd) })
    assert.deepEqual(await target.options.lun.read(0, 512), Buffer.alloc(512, 0xcd))
  })
})

describe('hydrate', () => {
  it('forces the whole disk into the cache', async () => {
    const { mixin, disk } = makeMixin()
    // a handful of blocks is enough to prove the point without allocating the
    // whole 2 GiB fixture disk
    const blockCount = 4
    disk.getVirtualSize = () => blockCount * 2 * 1024 * 1024
    disk.hasBlock = () => true
    disk.readBlock = async index => ({ index, data: Buffer.alloc(2 * 1024 * 1024, 0xab) })
    const { id } = await mount(mixin, makeXapi())

    const result = await mixin.hydrateDisk(id)

    assert.equal(result.id, id)
    assert.deepEqual(result.materialized, { blocks: blockCount, total: blockCount })
    assert.deepEqual(mixin.listMountedDisks()[0].materialized, result.materialized)
  })

  it('refuses to hydrate an uncached mount', async () => {
    const { mixin } = makeMixin()
    const { id } = await mount(mixin, makeXapi(), { cache: undefined, hostRef: HOST_REF })

    await assert.rejects(mixin.hydrateDisk(id), /has no cache to hydrate/)
  })

  it('rejects an unknown mount', async () => {
    const { mixin } = makeMixin()
    await assert.rejects(mixin.hydrateDisk('nope'), /no such live mount nope/)
  })
})

describe('unmount', () => {
  it('forgets the SR, releases the cache disk and the caller resources, in order', async () => {
    const { mixin, target, cache } = makeMixin()
    const xapi = makeXapi()
    let released = false

    const { id } = await mount(mixin, xapi, { release: async () => (released = true) })
    xapi.calls.length = 0

    await mixin.unmountDisk(id)

    assert.deepEqual(
      xapi.calls.map(([method]) => method),
      ['SR.get_PBDs', 'PBD.unplug', 'SR.forget', 'VBD_destroy', 'VDI_destroy']
    )
    assert.equal(target.closed, true)
    assert.equal(cache.closed, true)
    assert.equal(released, true)
    assert.deepEqual(mixin.listMountedDisks(), [])
  })

  it('still tears the rest down when forgetting the SR fails', async () => {
    const { mixin, target, cache } = makeMixin()
    const xapi = makeXapi()
    let released = false
    const { id } = await mount(mixin, xapi, { release: async () => (released = true) })
    xapi.call = async () => {
      throw new Error('SR_HAS_NO_PBDS')
    }

    await assert.rejects(mixin.unmountDisk(id), { message: `failed to unmount live mount ${id}` })

    // a failing step must not strand the socket, the fd, the VBD or the VDI
    assert.equal(target.closed, true)
    assert.equal(cache.closed, true)
    assert.ok(xapi.calls.some(([method]) => method === 'VBD_destroy'))
    assert.ok(xapi.calls.some(([method]) => method === 'VDI_destroy'))
    // the mount is gone either way, a half-released mount must not be retried
    assert.deepEqual(mixin.listMountedDisks(), [])
    // and the caller's resources are handed back despite the failure
    assert.equal(released, true)
  })

  it('rejects an unknown mount', async () => {
    const { mixin } = makeMixin()
    await assert.rejects(mixin.unmountDisk('nope'), /no such live mount nope/)
  })
})

describe('the stop hook', () => {
  it('tears down every live mount', async () => {
    const { mixin, hooks, target } = makeMixin()
    await mount(mixin, makeXapi())

    await Promise.all(hooks.listeners('stop').map(listener => listener()))

    assert.equal(target.closed, true)
    assert.deepEqual(mixin.listMountedDisks(), [])
  })
})
