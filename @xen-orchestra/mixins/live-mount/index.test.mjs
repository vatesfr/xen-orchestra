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
const SELF_VM_UUID = '0e3b8f2a-5c1d-4a7e-9f10-2b6d4c8e1a33'
const SELF_VM_REF = 'OpaqueRef:self'
const CACHE_SR_REF = 'OpaqueRef:cache-sr'
const CACHE_VDI_REF = 'OpaqueRef:cache-vdi'
const VBD_REF = 'OpaqueRef:cache-vbd'

class XapiError extends Error {
  constructor(code, params) {
    super(code)
    this.code = code
    this.params = params
  }
}

const makeXapi = ({ probeError, vdiSmConfig, defaultSr = CACHE_SR_REF, vbdCreateError, events } = {}) => {
  const calls = []
  const log = step => events?.push(step)
  // stands for xen-api's record cache: a `xo-collection`, which reports every removed record of
  // the pool under its `$id` — the uuid, for a VDI
  const objects = new EventEmitter()
  objects.remove = (...ids) => objects.emit('remove', Object.fromEntries(ids.map(id => [id, undefined])))

  // each mount introduces its own VDI, so the driver hands back a different uuid every time
  let nVdis = 0
  // `call` and `callAsync` answer the same way: which one a method goes through
  // is xen-api's concern, the assertions below only care that it was called
  const handle = (method, ...args) => {
    calls.push([method, ...args])
    switch (method) {
      case 'SR.probe':
        throw probeError ?? new XapiError('SR_BACKEND_FAILURE_107', ['', '', LUN_LIST_XML])
      case 'SR.introduce':
        return SR_REF
      case 'VDI.introduce':
        ++nVdis
        return undefined
      case 'PBD.create':
        return 'OpaqueRef:pbd'
      case 'SR.get_VDIs':
        return ['OpaqueRef:vdi']
      case 'SR.get_PBDs':
        return ['OpaqueRef:pbd']
      case 'VM.get_by_uuid':
        assert.equal(args[0], SELF_VM_UUID)
        return SELF_VM_REF
      case 'pool.get_all':
        return ['OpaqueRef:pool']
      case 'pool.get_default_SR':
        return defaultSr
      case 'SR.get_by_uuid':
        return `OpaqueRef:sr-${args[0]}`
      default:
        return undefined
    }
  }
  return {
    calls,
    objects,
    async call(method, ...args) {
      return handle(method, ...args)
    },
    async callAsync(method, ...args) {
      return handle(method, ...args)
    },
    async setFieldEntry(...args) {
      calls.push(['setFieldEntry', ...args])
    },
    async getField(type, ref, field) {
      calls.push(['getField', type, ref, field])
      if (type === 'host' && field === 'address') {
        return '10.20.30.40' // the host's own management address, as XAPI reports it
      }
      if (type === 'VDI' && field === 'virtual_size') {
        // XAPI rounds the requested size up to the SR's allocation quantum
        return DISK_SIZE + 2 * 1024 * 1024
      }
      return 'sr-uuid'
    },
    // `@xen-orchestra/xapi` exposes these as methods, not as `call()`s, so they need their own
    // entries rather than a case in `handle`
    async VDI_create(params) {
      calls.push(['VDI_create', params])
      log('cache VDI created')
      return CACHE_VDI_REF
    },
    async VDI_destroy(ref) {
      calls.push(['VDI_destroy', ref])
      log('cache VDI destroyed')
    },
    async VBD_create(params) {
      calls.push(['VBD_create', params])
      if (vbdCreateError !== undefined) {
        throw vbdCreateError
      }
      log('cache VBD created')
      return VBD_REF
    },
    async VBD_destroy(ref) {
      calls.push(['VBD_destroy', ref])
      log('cache VBD destroyed')
    },
    async getRecord(type, ref) {
      calls.push(['getRecord', type, ref])
      // the driver derives the VDI uuid from the LUN serial, so it differs from
      // the one we asked for
      return { uuid: nVdis > 1 ? `vdi-uuid-${nVdis}` : 'vdi-uuid', sm_config: vdiSmConfig ?? { SCSIid: SCSI_ID } }
    },
  }
}

const makeMixin = ({
  config = {},
  diskOpenError,
  listenError,
  advertisedAddress = '192.168.1.8',
  cacheDeviceError,
  deviceError,
  selfVmUuidError,
} = {}) => {
  const hooks = new EventEmitter()
  const detectAddressCalls = []
  // ordered log of the outward-facing steps, to assert what runs and in which order
  const events = []
  const app = {
    config: {
      getOptional: path => {
        if (path === 'iscsi.advertisedAddress') {
          // `null` (as opposed to the default) simulates an unset config key
          return advertisedAddress === null ? undefined : advertisedAddress
        }
        assert.ok(
          ['iscsi.bindAddress', 'iscsi.cache', 'iscsi.cacheHydrate', 'iscsi.cacheSr'].includes(path),
          `unexpected config key ${path}`
        )
        return config[path]
      },
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
    close: async () => {
      events.push('target closed')
      target.closed = true
    },
  }

  // stands in for the RawBlockDevice over the hot-plugged VDI
  const cacheDevice = {
    closed: false,
    opened: false,
    options: undefined,
    data: Buffer.alloc(DISK_SIZE),
    open: async () => {
      if (cacheDeviceError !== undefined) {
        throw cacheDeviceError
      }
      cacheDevice.opened = true
    },
    getSize: () => cacheDevice.options.size,
    getBlockSize: () => 512,
    read: async (offset, length) => cacheDevice.data.subarray(offset, offset + length),
    write: async (offset, data) => {
      data.copy(cacheDevice.data, offset)
    },
    flush: async () => {},
    close: async () => {
      events.push('cache device closed')
      cacheDevice.closed = true
    },
  }

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
    detectAddress: async hostAddress => {
      detectAddressCalls.push(hostAddress)
      return '203.0.113.7'
    },
    createCacheDevice: options => {
      cacheDevice.options = options
      return cacheDevice
    },
    getSelfVmUuid: async () => {
      if (selfVmUuidError !== undefined) {
        throw selfVmUuidError
      }
      return SELF_VM_UUID
    },
    waitForVbdDevice: async (xapi, vbdRef) => {
      if (deviceError !== undefined) {
        throw deviceError
      }
      assert.equal(vbdRef, VBD_REF)
      return '/dev/xvdc'
    },
  })

  return { app, cacheDevice, detectAddressCalls, disk, events, hooks, mixin, target }
}

const mountDisk = (mixin, xapi, params) =>
  mixin.mountDisk({
    diskPath: 'xo-vm-backups/vm/vdis/job/vdi/20260731T120000Z.vhd',
    hostRef: HOST_REF,
    xapi,
    ...params,
  })

describe('mountDisk', () => {
  it('serves the chain and attaches it as a non-shared iscsi SR on the host', async () => {
    const { mixin, target, disk } = makeMixin()
    const xapi = makeXapi()

    const result = await mountDisk(mixin, xapi)

    // the SR uuid is ours, since we introduce the SR instead of creating it
    assert.equal(result.srUuid, xapi.calls.find(([method]) => method === 'SR.introduce')[1])
    assert.match(result.srUuid, /^[0-9a-f-]{36}$/)
    assert.equal(result.vdiUuid, 'vdi-uuid')
    assert.equal(result.address, '192.168.1.8')
    assert.equal(result.port, 34567)
    assert.match(result.iqn, /^iqn\.2026-07\.tech\.vates\.xo:live-mount-[0-9a-f]{32}$/)

    // the chain is opened with its block allocation tables
    assert.equal(disk.params.path, 'xo-vm-backups/vm/vdis/job/vdi/20260731T120000Z.vhd')
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

    // the PBD is created on the requested host only
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
    assert.equal(vdiIntroduce[7], true) // read_only
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
      mixin.listMountedDisks().map(({ id, srUuid, vdiUuid }) => ({ id, srUuid, vdiUuid })),
      [{ id: result.id, srUuid: result.srUuid, vdiUuid: 'vdi-uuid' }]
    )
  })

  it('reports an unreachable target as a configuration problem', async () => {
    const { mixin } = makeMixin()
    const xapi = makeXapi({ probeError: new XapiError('SR_BACKEND_FAILURE_141', []) })

    await assert.rejects(mountDisk(mixin, xapi), /cannot reach the iSCSI target at 192\.168\.1\.8/)
  })

  it('closes the target and the disk when the probe fails', async () => {
    const { mixin, target, disk } = makeMixin()
    const xapi = makeXapi({ probeError: new XapiError('SR_BACKEND_FAILURE_666', []) })

    await assert.rejects(mountDisk(mixin, xapi), { code: 'SR_BACKEND_FAILURE_666' })

    assert.equal(target.closed, true)
    assert.equal(disk.closed, true)
    assert.deepEqual(mixin.listMountedDisks(), [])
  })

  it('closes the disk when the target cannot listen', async () => {
    const { mixin, disk } = makeMixin({ listenError: new Error('EADDRINUSE') })

    await assert.rejects(mountDisk(mixin, makeXapi()), /EADDRINUSE/)

    assert.equal(disk.closed, true)
  })

  it('auto-detects the address when iscsi.advertisedAddress is not configured', async () => {
    const { mixin, detectAddressCalls } = makeMixin({ advertisedAddress: null })
    const xapi = makeXapi()

    const result = await mountDisk(mixin, xapi)

    assert.equal(result.address, '203.0.113.7')
    // detected by routing towards the target host's own address, not guessed blindly
    assert.deepEqual(detectAddressCalls, ['10.20.30.40'])
    assert.ok(
      xapi.calls.some(([method, , ref, field]) => method === 'getField' && ref === HOST_REF && field === 'address')
    )
  })
})

describe('unmountDisk', () => {
  it('unplugs, forgets, closes the target and releases the caller resources', async () => {
    const { mixin, target } = makeMixin()
    const xapi = makeXapi()
    let released = false

    const { id } = await mountDisk(mixin, xapi, { release: async () => (released = true) })
    xapi.calls.length = 0

    await mixin.unmountDisk(id)

    assert.deepEqual(
      xapi.calls.map(([method]) => method),
      ['SR.get_PBDs', 'PBD.unplug', 'SR.forget']
    )
    assert.equal(target.closed, true)
    assert.equal(released, true)
    assert.deepEqual(mixin.listMountedDisks(), [])
  })

  it('still closes the target and releases resources when forgetting the SR fails', async () => {
    const { mixin, target } = makeMixin()
    const xapi = makeXapi()
    let released = false
    const { id } = await mountDisk(mixin, xapi, { release: async () => (released = true) })
    xapi.call = xapi.callAsync = async () => {
      throw new Error('SR_HAS_NO_PBDS')
    }

    await assert.rejects(mixin.unmountDisk(id), error => {
      assert.match(error.message, /failed to unmount live mount/)
      assert.equal(error.cause.message, 'SR_HAS_NO_PBDS')
      return true
    })

    assert.equal(target.closed, true)
    assert.equal(released, true)
    // the mount is gone either way, a half-released mount must not be retried
    assert.deepEqual(mixin.listMountedDisks(), [])
  })

  it('rejects an unknown mount', async () => {
    const { mixin } = makeMixin()
    await assert.rejects(mixin.unmountDisk('nope'), /no such live mount nope/)
  })

  it('notifies its listeners', async () => {
    const { mixin } = makeMixin()
    const unmounted = []
    mixin.on('unmounted', id => unmounted.push(id))

    const { id } = await mountDisk(mixin, makeXapi())
    await mixin.unmountDisk(id)

    assert.deepEqual(unmounted, [id])
  })
})

describe('when the live mounted VDI is removed', () => {
  // the mount is released asynchronously, from an event handler
  const unmountedMount = mixin =>
    new Promise(resolve => {
      mixin.once('unmounted', resolve)
    })

  it('forgets the SR, closes the target and releases the caller resources', async () => {
    const { mixin, target } = makeMixin()
    const xapi = makeXapi()
    let released = false
    const { id, vdiUuid } = await mountDisk(mixin, xapi, { release: async () => (released = true) })
    xapi.calls.length = 0

    xapi.objects.remove(vdiUuid)

    assert.equal(await unmountedMount(mixin), id)
    assert.deepEqual(
      xapi.calls.map(([method]) => method),
      ['SR.get_PBDs', 'PBD.unplug', 'SR.forget']
    )
    assert.equal(target.closed, true)
    assert.equal(released, true)
    assert.deepEqual(mixin.listMountedDisks(), [])
  })

  it('leaves the other mounts of the same connection alone', async () => {
    const { mixin } = makeMixin()
    const xapi = makeXapi()
    const first = await mountDisk(mixin, xapi)
    const second = await mountDisk(mixin, xapi, { diskPath: 'xo-vm-backups/vm/vdis/job/vdi/20260801T120000Z.vhd' })

    assert.notEqual(first.vdiUuid, second.vdiUuid)
    xapi.objects.remove(first.vdiUuid)

    await unmountedMount(mixin)
    assert.deepEqual(
      mixin.listMountedDisks().map(({ id }) => id),
      [second.id]
    )
  })

  it('ignores the removal of anything else', async () => {
    const { mixin } = makeMixin()
    const xapi = makeXapi()
    const { id } = await mountDisk(mixin, xapi)

    xapi.objects.remove('some-other-object')

    await new Promise(resolve => setImmediate(resolve))
    assert.deepEqual(
      mixin.listMountedDisks().map(_ => _.id),
      [id]
    )
  })

  it('is no longer expected once the mount was unmounted explicitly', async () => {
    const { mixin } = makeMixin()
    const xapi = makeXapi()
    const { id, vdiUuid } = await mountDisk(mixin, xapi)
    const unmounted = []
    mixin.on('unmounted', _ => unmounted.push(_))

    await mixin.unmountDisk(id)
    // forgetting the SR removes the VDI: that removal must not feed back into a second teardown
    xapi.objects.remove(vdiUuid)

    await new Promise(resolve => setImmediate(resolve))
    assert.deepEqual(unmounted, [id])
  })

  it('does not watch a connection which does not report its objects', async () => {
    const { mixin } = makeMixin()
    const xapi = makeXapi()
    delete xapi.objects

    const { id } = await mountDisk(mixin, xapi)

    assert.deepEqual(
      mixin.listMountedDisks().map(_ => _.id),
      [id]
    )
  })
})

describe('the stop hook', () => {
  it('tears down every live mount', async () => {
    const { mixin, hooks, target } = makeMixin()
    await mountDisk(mixin, makeXapi())

    await Promise.all(hooks.listeners('stop').map(listener => listener()))

    assert.equal(target.closed, true)
    assert.deepEqual(mixin.listMountedDisks(), [])
  })
})

describe('the read cache', () => {
  it('is not provisioned unless it is asked for', async () => {
    const { mixin } = makeMixin()
    const xapi = makeXapi()

    await mountDisk(mixin, xapi)

    // the default mount must stay exactly what it was: nothing local, nothing
    // tying it to this appliance's own pool
    assert.ok(
      !xapi.calls.some(([method]) => method.startsWith('VDI_') || method.startsWith('VBD_')),
      'no VDI or VBD was created'
    )
    assert.ok(!xapi.calls.some(([method]) => method === 'VM.get_by_uuid'))
  })

  it('creates a VDI the size of the disk and hot-plugs it onto this appliance', async () => {
    const { mixin, cacheDevice, target } = makeMixin()
    const xapi = makeXapi()

    const result = await mountDisk(mixin, xapi, { cache: true })

    const vdiCreate = xapi.calls.find(([method]) => method === 'VDI_create')[1]
    assert.equal(vdiCreate.SR, CACHE_SR_REF)
    assert.equal(vdiCreate.virtual_size, DISK_SIZE)
    // tagged like the SR is, so a leftover after a hard kill is recognizable
    assert.equal(vdiCreate.other_config['xo:live-mount'], result.id)

    const vbdCreate = xapi.calls.find(([method]) => method === 'VBD_create')[1]
    assert.equal(vbdCreate.VM, SELF_VM_REF)
    assert.equal(vbdCreate.VDI, CACHE_VDI_REF)
    assert.equal(vbdCreate.mode, 'RW')
    assert.equal(vbdCreate.unpluggable, true)
    // a silently unplugged VBD would resurface as a device which never appears
    assert.equal(vbdCreate.throwVbdPlug, true)
    // XAPI picks the slot: the userdevice to xvd<letter> mapping is a guest convention
    assert.equal(vbdCreate.userdevice, undefined)

    // the capacity comes from what XAPI recorded, not from the device node
    assert.equal(cacheDevice.options.path, '/dev/xvdc')
    assert.equal(cacheDevice.options.size, DISK_SIZE + 2 * 1024 * 1024)
    assert.equal(cacheDevice.opened, true)

    // and the LUN is the caching one, still exposing the disk's own size
    assert.equal(target.options.lun.getSize(), DISK_SIZE)
  })

  it('serves a read from the source once, then from the cache', async () => {
    const { mixin, target, disk } = makeMixin()
    disk.hasBlock = () => true
    disk.readBlock = async index => {
      disk.readBlocks.push(index)
      return { index, data: Buffer.alloc(disk.getBlockSize(), 0x5a) }
    }
    disk.readBlocks = []

    await mountDisk(mixin, makeXapi(), { cache: true })

    const lun = target.options.lun
    assert.deepEqual(await lun.read(0, 512), Buffer.alloc(512, 0x5a))
    assert.deepEqual(disk.readBlocks, [0])
    // the whole point: a second read of the same block does not go back out
    assert.deepEqual(await lun.read(512, 512), Buffer.alloc(512, 0x5a))
    assert.deepEqual(disk.readBlocks, [0])
  })

  it('takes the SR from the call, then the config, then the pool default', async () => {
    const asked = await (async () => {
      const { mixin } = makeMixin()
      const xapi = makeXapi()
      await mountDisk(mixin, xapi, { cache: { srUuid: 'asked' } })
      return xapi.calls.find(([method]) => method === 'VDI_create')[1].SR
    })()
    assert.equal(asked, 'OpaqueRef:sr-asked')

    const configured = await (async () => {
      const { mixin } = makeMixin({ config: { 'iscsi.cacheSr': 'configured' } })
      const xapi = makeXapi()
      await mountDisk(mixin, xapi, { cache: true })
      return xapi.calls.find(([method]) => method === 'VDI_create')[1].SR
    })()
    assert.equal(configured, 'OpaqueRef:sr-configured')

    const byDefault = await (async () => {
      const { mixin } = makeMixin()
      const xapi = makeXapi()
      await mountDisk(mixin, xapi, { cache: true })
      return xapi.calls.find(([method]) => method === 'VDI_create')[1].SR
    })()
    assert.equal(byDefault, CACHE_SR_REF)
  })

  it('is enabled by the config alone', async () => {
    const { mixin } = makeMixin({ config: { 'iscsi.cache': true } })
    const xapi = makeXapi()
    await mountDisk(mixin, xapi)
    assert.ok(xapi.calls.some(([method]) => method === 'VDI_create'))
  })

  it('names the config key when the pool has no default SR, having created nothing', async () => {
    const { mixin, disk } = makeMixin()
    const xapi = makeXapi({ defaultSr: 'OpaqueRef:NULL' })
    await assert.rejects(mountDisk(mixin, xapi, { cache: true }), /set iscsi.cacheSr/)
    assert.ok(!xapi.calls.some(([method]) => method === 'VDI_create'))
    assert.equal(disk.closed, true)
  })

  it('says so when this appliance is a VM of another pool, having created nothing', async () => {
    const { mixin, disk } = makeMixin({ selfVmUuidError: undefined })
    const xapi = makeXapi()
    xapi.call = async method => {
      if (method === 'VM.get_by_uuid') {
        throw new XapiError('UUID_INVALID', ['VM', SELF_VM_UUID])
      }
      return undefined
    }
    await assert.rejects(mountDisk(mixin, xapi, { cache: true }), /pool the disk is mounted onto/)
    assert.equal(disk.closed, true)
  })

  describe('unwinds what it created when the mount fails later', () => {
    it('on a failing SCSI probe, closing the device before destroying the VBD', async () => {
      const { mixin, cacheDevice, events, disk } = makeMixin()
      const xapi = makeXapi({ events, probeError: new Error('probe blew up') })

      await assert.rejects(mountDisk(mixin, xapi, { cache: true }), /probe blew up/)

      assert.deepEqual(events, [
        'cache VDI created',
        'cache VBD created',
        'target closed',
        'cache device closed',
        'cache VBD destroyed',
        'cache VDI destroyed',
      ])
      assert.equal(cacheDevice.closed, true)
      assert.equal(disk.closed, true)
    })

    it('on a VBD that cannot be plugged, destroying the VDI', async () => {
      const { mixin, events, disk } = makeMixin()
      const xapi = makeXapi({ events, vbdCreateError: new Error('no free slot') })

      await assert.rejects(mountDisk(mixin, xapi, { cache: true }), /no free slot/)

      assert.deepEqual(events, ['cache VDI created', 'cache VDI destroyed'])
      assert.equal(disk.closed, true)
    })

    it('on a device which never appears, destroying both', async () => {
      const { mixin, cacheDevice, events } = makeMixin({ deviceError: new Error('never appeared') })
      const xapi = makeXapi({ events })

      await assert.rejects(mountDisk(mixin, xapi, { cache: true }), /never appeared/)

      assert.deepEqual(events, ['cache VDI created', 'cache VBD created', 'cache VBD destroyed', 'cache VDI destroyed'])
      assert.equal(cacheDevice.opened, false)
    })
  })

  it('tears the cache down in an order which cannot leak the VDI', async () => {
    const { mixin, events } = makeMixin()
    const xapi = makeXapi({ events })

    const { id } = await mountDisk(mixin, xapi, { cache: true })
    events.length = 0
    await mixin.unmountDisk(id)

    // the descriptor must be closed before the VBD is unplugged, or the kernel
    // refuses to release the device and the VDI stays behind
    assert.deepEqual(events, ['target closed', 'cache device closed', 'cache VBD destroyed', 'cache VDI destroyed'])
  })

  it('destroys the VDI even when closing the target failed', async () => {
    const { mixin, target, events } = makeMixin()
    const xapi = makeXapi({ events })

    const { id } = await mountDisk(mixin, xapi, { cache: true })
    target.close = async () => {
      throw new Error('socket stuck')
    }
    events.length = 0

    await assert.rejects(mixin.unmountDisk(id), /failed to unmount live mount/)
    // the target never got to close the LUN, so the explicit close is what frees the device
    assert.deepEqual(events, ['cache device closed', 'cache VBD destroyed', 'cache VDI destroyed'])
  })

  it('runs every later step when destroying the VBD fails', async () => {
    const { mixin, events } = makeMixin()
    const xapi = makeXapi({ events })

    let released = false
    const { id } = await mountDisk(mixin, xapi, {
      cache: true,
      release: async () => {
        released = true
      },
    })
    xapi.VBD_destroy = async () => {
      throw new Error('still busy')
    }

    await assert.rejects(
      mixin.unmountDisk(id).catch(error => {
        assert.match(error.cause.message, /still busy/)
        throw error
      }),
      /failed to unmount live mount/
    )
    // a busy VBD must not strand the VDI, nor the caller's handler
    assert.ok(events.includes('cache VDI destroyed'), 'the VDI was destroyed anyway')
    assert.equal(released, true)
  })

  it('reports how much of the disk is local, and nothing without a cache', async () => {
    const { mixin } = makeMixin()
    const xapi = makeXapi()

    await mountDisk(mixin, xapi, { cache: true })
    const [cached] = mixin.listMountedDisks()
    assert.deepEqual(cached.cache, { blocks: 0, total: DISK_SIZE / (2 * 1024 * 1024) })

    await mountDisk(mixin, xapi)
    const uncached = mixin.listMountedDisks()[1]
    assert.equal(uncached.cache, undefined)
  })

  it('hydrates the whole disk in the background when asked', async () => {
    const { mixin, target, disk } = makeMixin()
    disk.hasBlock = () => true
    disk.readBlock = async index => ({ index, data: Buffer.alloc(disk.getBlockSize()) })

    const { id } = await mountDisk(mixin, makeXapi(), { cache: { hydrate: true } })
    const lun = target.options.lun

    // mountDisk returns without waiting for it, so the disk becomes local on its own
    const { total } = lun.getMaterialized()
    while (lun.getMaterialized().blocks < total) {
      await new Promise(resolve => setImmediate(resolve))
    }

    // and an aborted hydration must not surface as an unhandled rejection
    await mixin.unmountDisk(id)
  })

  it('does not hydrate by default', async () => {
    const { mixin, target } = makeMixin()

    const { id } = await mountDisk(mixin, makeXapi(), { cache: true })
    const lun = target.options.lun

    // let anything that was going to start, start
    for (let i = 0; i < 10; i++) {
      await new Promise(resolve => setImmediate(resolve))
    }
    assert.equal(lun.getMaterialized().blocks, 0)

    await mixin.unmountDisk(id)
  })
})
