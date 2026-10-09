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
const CACHE_SR_UUID = '6a1f0c3e-8d2b-4f7a-b5e9-3c4d2e1f0a99'
const CACHE_SR_REF = `OpaqueRef:sr-${CACHE_SR_UUID}`
const CACHE_VDI_REF = 'OpaqueRef:cache-vdi'
const VBD_REF = 'OpaqueRef:cache-vbd'
// the host this appliance runs on
const APPLIANCE_HOST_REF = 'OpaqueRef:appliance-host'

class XapiError extends Error {
  constructor(code, params) {
    super(code)
    this.code = code
    this.params = params
  }
}

// what a cached mount is asked for
const CACHE = { cacheSrUuid: CACHE_SR_UUID, vmUuid: SELF_VM_UUID }

const makeXapi = ({
  poolUuid = 'pool-uuid',
  probeError,
  vdiSmConfig,
  vbdCreateError,
  vbdDevice = 'xvdc',
  events,
  cacheSrPluggedOn = APPLIANCE_HOST_REF,
} = {}) => {
  const calls = []
  // what xen-api's object cache holds for the records the cache is built from
  const records = {
    [SELF_VM_REF]: { resident_on: APPLIANCE_HOST_REF },
    [CACHE_SR_REF]: { $PBDs: [{ host: cacheSrPluggedOn, currently_attached: true }] },
    // XAPI rounds the requested size up to the SR's allocation quantum
    [CACHE_VDI_REF]: { virtual_size: DISK_SIZE + 2 * 1024 * 1024 },
  }
  const log = step => events?.push(step)
  // stands for xen-api's record cache: a `xo-collection` whose type index reports each removed
  // record of the pool on its own, per type
  const emitters = { __proto__: null }
  const getEventEmitterByType = type => (emitters[type] ??= new EventEmitter())
  const objects = { allIndexes: { type: { getEventEmitterByType } } }
  const removeRecord = ($type, uuid) => getEventEmitterByType($type).emit('remove', undefined, { $type, uuid })

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
        if (xapi.srGone) {
          throw new XapiError('HANDLE_INVALID', ['SR', SR_REF])
        }
        return ['OpaqueRef:pbd']
      case 'VM.get_by_uuid':
        if (args[0] !== SELF_VM_UUID) {
          throw new XapiError('UUID_INVALID', ['VM', args[0]])
        }
        return SELF_VM_REF
      case 'SR.get_by_uuid':
        return `OpaqueRef:sr-${args[0]}`
      default:
        return undefined
    }
  }
  const xapi = {
    calls,
    objects,
    pool: { uuid: poolUuid },
    removeRecord,
    // set to answer for an SR which no longer exists
    srGone: false,
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
    async barrier(ref) {
      calls.push(['barrier', ref])
      assert.equal(ref, VBD_REF)
      return { device: vbdDevice }
    },
    getObjectByRef(ref) {
      assert.ok(ref in records, `unexpected record ${ref}`)
      return records[ref]
    },
    async getRecord(type, ref) {
      calls.push(['getRecord', type, ref])
      // the driver derives the VDI uuid from the LUN serial, so it differs from
      // the one we asked for
      return { uuid: nVdis > 1 ? `vdi-uuid-${nVdis}` : 'vdi-uuid', sm_config: vdiSmConfig ?? { SCSIid: SCSI_ID } }
    },
  }
  return xapi
}

// records what the mixin asks of the firewall, instead of running iptables
const makeFirewall = ({ openError, available = true } = {}) => {
  const firewall = {
    calls: [],
    async open(rule) {
      firewall.calls.push(['open', rule])
      if (openError !== undefined) {
        throw openError
      }
      return available
    },
    async close(rule) {
      firewall.calls.push(['close', rule])
    },
    async purge() {
      firewall.calls.push(['purge'])
      return []
    },
  }
  return firewall
}

const makeMixin = ({
  config = {},
  diskOpenError,
  listenError,
  advertisedAddress = '192.168.1.8',
  manageFirewall,
  firewall = makeFirewall(),
  // thrown by the successive opens of the cache device, in order
  cacheDeviceOpenErrors = [],
} = {}) => {
  const hooks = new EventEmitter()
  const detectAddressCalls = []
  const createFirewallCalls = []
  // ordered log of the outward-facing steps, to assert what runs and in which order
  const events = []
  const app = {
    config: {
      getOptional: path => {
        if (path === 'iscsi.advertisedAddress') {
          // `null` (as opposed to the default) simulates an unset config key
          return advertisedAddress === null ? undefined : advertisedAddress
        }
        if (path === 'iscsi.manageFirewall') {
          return manageFirewall
        }
        assert.equal(path, 'iscsi.bindAddress', `unexpected config key ${path}`)
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

  // stands in for the FileBlockDevice over the hot-plugged VDI
  const cacheDevice = {
    closed: false,
    opened: false,
    options: undefined,
    data: Buffer.alloc(DISK_SIZE),
    open: async () => {
      const error = cacheDeviceOpenErrors.shift()
      if (error !== undefined) {
        throw error
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
    appName: 'xo-server',
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
    createFirewall: name => {
      createFirewallCalls.push(name)
      return name === 'ufw' ? firewall : undefined
    },
    createCacheDevice: options => {
      cacheDevice.options = options
      return cacheDevice
    },
  })

  return {
    app,
    cacheDevice,
    createFirewallCalls,
    detectAddressCalls,
    disk,
    events,
    firewall,
    hooks,
    mixin,
    target,
  }
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

    // ephemeral SR: tagged and not scanned at boot, and its VDI tagged too
    assert.deepEqual(
      xapi.calls
        .filter(([method]) => method === 'setFieldEntry')
        .map(([, type, , , entry, value]) => [type, entry, value]),
      [
        ['SR', 'xo:live-mount', result.id],
        ['SR', 'auto-scan', 'false'],
        ['VDI', 'xo:live-mount', result.id],
      ]
    )
    // VDI.read_only is StaticRO in XAPI: nothing may try to set it
    assert.ok(!xapi.calls.some(([method]) => method === 'VDI.set_read_only'))

    assert.deepEqual(
      mixin.listMountedDisks().map(({ id, srUuid, vdiUuid }) => ({ id, srUuid, vdiUuid })),
      [{ id: result.id, srUuid: result.srUuid, vdiUuid: 'vdi-uuid' }]
    )
  })

  it('names the SR and the VDI as the caller asks', async () => {
    const { mixin } = makeMixin()
    const xapi = makeXapi()

    await mountDisk(mixin, xapi, {
      xapiLabels: {
        srNameLabel: '[XO live mount] web01',
        vdiNameLabel: 'system',
        vdiNameDescription: 'live mount of web01',
      },
    })

    const srIntroduce = xapi.calls.find(([method]) => method === 'SR.introduce')
    assert.equal(srIntroduce[2], '[XO live mount] web01')
    const vdiIntroduce = xapi.calls.find(([method]) => method === 'VDI.introduce')
    assert.equal(vdiIntroduce[2], 'system')
    assert.equal(vdiIntroduce[3], 'live mount of web01')
  })

  it('advertises an uncached LUN as write protected', async () => {
    const { mixin, target } = makeMixin()
    await mountDisk(mixin, makeXapi())
    assert.equal(target.options.lun.isReadOnly(), true)
  })

  it('reports an unreachable target as a configuration problem', async () => {
    const { mixin } = makeMixin()
    const xapi = makeXapi({ probeError: new XapiError('SR_BACKEND_FAILURE_141', []) })

    await assert.rejects(mountDisk(mixin, xapi), /cannot reach the iSCSI target at 192\.168\.1\.8:34567, .* firewalls/)
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

  it('succeeds when the SR is already gone, e.g. forgotten by hand', async () => {
    const { mixin, target } = makeMixin()
    const xapi = makeXapi()
    let released = false

    const { id } = await mountDisk(mixin, xapi, { release: async () => (released = true) })
    xapi.calls.length = 0
    xapi.srGone = true

    await mixin.unmountDisk(id)

    assert.deepEqual(
      xapi.calls.map(([method]) => method),
      ['SR.get_PBDs']
    )
    assert.equal(target.closed, true)
    assert.equal(released, true)
  })

  it('still closes the target and releases resources when forgetting the SR fails', async () => {
    const { mixin, target } = makeMixin()
    const xapi = makeXapi()
    let released = false
    const unmounted = []
    mixin.on('unmounted', id => unmounted.push(id))
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
    // and whoever tracks it must hear about it
    assert.deepEqual(unmounted, [id])
  })

  it('rejects an unknown mount', async () => {
    const { mixin } = makeMixin()
    await assert.rejects(mixin.unmountDisk('nope'), { code: 1, data: { id: 'nope', type: 'live-mount' } })
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

    xapi.removeRecord('VDI', vdiUuid)

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
    xapi.removeRecord('VDI', first.vdiUuid)

    await unmountedMount(mixin)
    assert.deepEqual(
      mixin.listMountedDisks().map(({ id }) => id),
      [second.id]
    )
  })

  it('ignores the removal of anything else', async () => {
    const { mixin } = makeMixin()
    const xapi = makeXapi()
    const { id, vdiUuid } = await mountDisk(mixin, xapi)

    xapi.removeRecord('VDI', 'some-other-vdi')
    // a record of another type which happens to share the uuid
    xapi.removeRecord('SR', vdiUuid)

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
    xapi.removeRecord('VDI', vdiUuid)

    await new Promise(resolve => setImmediate(resolve))
    assert.deepEqual(unmounted, [id])
  })
})

describe('after a reconnection', () => {
  const unmountedMount = mixin =>
    new Promise(resolve => {
      mixin.once('unmounted', resolve)
    })

  it('unmounts when the VDI removal is reported by the new connection, and tears down through it', async () => {
    const { mixin, target } = makeMixin()
    const disconnected = makeXapi()
    const { id, vdiUuid } = await mountDisk(mixin, disconnected)
    disconnected.calls.length = 0

    const reconnected = makeXapi()
    mixin.watchConnection(reconnected)
    reconnected.removeRecord('VDI', vdiUuid)

    assert.equal(await unmountedMount(mixin), id)
    // the previous connection no longer answers: the SR must be forgotten through the new one
    assert.deepEqual(disconnected.calls, [])
    assert.deepEqual(
      reconnected.calls.map(([method]) => method),
      ['SR.get_PBDs', 'PBD.unplug', 'SR.forget']
    )
    assert.equal(target.closed, true)
  })

  it('unmounts explicitly through the new connection', async () => {
    const { mixin } = makeMixin()
    const disconnected = makeXapi()
    const { id } = await mountDisk(mixin, disconnected)
    disconnected.calls.length = 0

    const reconnected = makeXapi()
    mixin.watchConnection(reconnected)
    await mixin.unmountDisk(id)

    assert.deepEqual(disconnected.calls, [])
    assert.equal(reconnected.calls.at(-1)[0], 'SR.forget')
  })

  it('leaves the mounts of other pools on their own connection', async () => {
    const { mixin } = makeMixin()
    const xapi = makeXapi()
    const { id } = await mountDisk(mixin, xapi)
    xapi.calls.length = 0

    const otherPool = makeXapi({ poolUuid: 'other-pool-uuid' })
    mixin.watchConnection(otherPool)
    await mixin.unmountDisk(id)

    assert.deepEqual(otherPool.calls, [])
    assert.equal(xapi.calls.at(-1)[0], 'SR.forget')
  })

  it('listens only once to a connection handed several times', async () => {
    const { mixin } = makeMixin()
    const xapi = makeXapi()
    await mountDisk(mixin, xapi)

    mixin.watchConnection(xapi)
    mixin.watchConnection(xapi)

    assert.equal(xapi.objects.allIndexes.type.getEventEmitterByType('VDI').listenerCount('remove'), 1)
  })
})

describe('iscsi.manageFirewall', () => {
  it('drives no firewall when unset', async () => {
    const { mixin, createFirewallCalls, hooks } = makeMixin()

    await mountDisk(mixin, makeXapi())

    assert.deepEqual(createFirewallCalls, [])
    assert.deepEqual(hooks.listeners('start'), [])
  })

  it('opens the port of the target to the host, even with an advertised address', async () => {
    const { mixin, firewall } = makeMixin({ manageFirewall: 'ufw' })
    const xapi = makeXapi()

    const { id } = await mountDisk(mixin, xapi)

    assert.deepEqual(firewall.calls, [['purge'], ['open', { source: '10.20.30.40', port: 34567, id }]])
    // opened before the host first connects, which is the probe
    const probeIndex = xapi.calls.findIndex(([method]) => method === 'SR.probe')
    const hostAddressIndex = xapi.calls.findIndex(([method, , , field]) => method === 'getField' && field === 'address')
    assert.ok(hostAddressIndex !== -1 && hostAddressIndex < probeIndex)
  })

  it('closes the port on unmount, after the target', async () => {
    const { mixin, firewall, target } = makeMixin({ manageFirewall: 'ufw' })
    const { id } = await mountDisk(mixin, makeXapi())
    firewall.calls.length = 0
    let targetClosedFirst
    const { close } = firewall
    firewall.close = async rule => {
      targetClosedFirst = target.closed
      return close(rule)
    }

    await mixin.unmountDisk(id)

    assert.deepEqual(firewall.calls, [['close', { source: '10.20.30.40', port: 34567, id }]])
    assert.equal(targetClosedFirst, true)
  })

  it('closes the port when the mount fails afterwards', async () => {
    const { mixin, firewall, target } = makeMixin({ manageFirewall: 'ufw' })

    await assert.rejects(
      mountDisk(mixin, makeXapi({ probeError: new XapiError('SR_BACKEND_FAILURE_141', []) })),
      /cannot reach the iSCSI target/
    )

    assert.deepEqual(
      firewall.calls.map(([action]) => action),
      ['purge', 'open', 'close']
    )
    assert.equal(target.closed, true)
  })

  it('closes the target when the port cannot be opened', async () => {
    const { mixin, disk, target } = makeMixin({
      manageFirewall: 'ufw',
      firewall: makeFirewall({ openError: new Error('iptables failed') }),
    })
    const xapi = makeXapi()

    await assert.rejects(mountDisk(mixin, xapi), /iptables failed/)

    assert.equal(target.closed, true)
    assert.equal(disk.closed, true)
    assert.ok(!xapi.calls.some(([method]) => method === 'SR.probe'))
  })

  it('neither records nor closes a rule when there is no firewall to drive', async () => {
    const { mixin, firewall } = makeMixin({ manageFirewall: 'ufw', firewall: makeFirewall({ available: false }) })
    const { id } = await mountDisk(mixin, makeXapi())

    await mixin.unmountDisk(id)

    assert.deepEqual(
      firewall.calls.map(([action]) => action),
      ['purge', 'open']
    )
  })

  it('does not close a rule it could not open when the mount fails', async () => {
    const { mixin, firewall } = makeMixin({ manageFirewall: 'ufw', firewall: makeFirewall({ available: false }) })

    await assert.rejects(mountDisk(mixin, makeXapi({ probeError: new XapiError('SR_BACKEND_FAILURE_141', []) })))

    assert.deepEqual(
      firewall.calls.map(([action]) => action),
      ['purge', 'open']
    )
  })

  it('drives no firewall when set to false, overriding the packaged default', async () => {
    const { mixin, createFirewallCalls, hooks } = makeMixin({ manageFirewall: false })

    await mountDisk(mixin, makeXapi())

    assert.deepEqual(createFirewallCalls, [])
    assert.deepEqual(hooks.listeners('start'), [])
  })

  it('removes the stale rules on start', async () => {
    const { firewall, hooks } = makeMixin({ manageFirewall: 'ufw' })

    await Promise.all(hooks.listeners('start').map(listener => listener()))

    assert.deepEqual(firewall.calls, [['purge']])
  })

  it('removes the stale rules before the first rule, even when mounting before start, and only once', async () => {
    const { mixin, firewall, hooks } = makeMixin({ manageFirewall: 'ufw' })

    const { id } = await mountDisk(mixin, makeXapi())
    await Promise.all(hooks.listeners('start').map(listener => listener()))
    await mountDisk(mixin, makeXapi())

    assert.deepEqual(
      firewall.calls.map(([action]) => action),
      ['purge', 'open', 'open']
    )
    assert.equal(firewall.calls[1][1].id, id)
  })

  it('does not fail the start when the stale rules cannot be removed', async () => {
    const firewall = makeFirewall()
    firewall.purge = async () => {
      throw new Error('ufw is not enabled')
    }
    const { hooks } = makeMixin({ manageFirewall: 'ufw', firewall })

    await Promise.all(hooks.listeners('start').map(listener => listener()))
  })

  it('fails the mounts, not the process, when unsupported', async () => {
    const { mixin, hooks } = makeMixin({ manageFirewall: 'firewalld' })
    const xapi = makeXapi()

    await assert.rejects(mountDisk(mixin, xapi), /unsupported iscsi.manageFirewall: firewalld, expected one of ufw/)

    assert.deepEqual(xapi.calls, [])
    assert.deepEqual(hooks.listeners('start'), [])
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

    const result = await mountDisk(mixin, xapi, CACHE)

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

  it('is read/write, down to the VDI attached to the host', async () => {
    const { mixin, target } = makeMixin()
    const xapi = makeXapi()

    await mountDisk(mixin, xapi, CACHE)

    assert.notEqual(target.options.lun.isReadOnly?.(), true)
    const vdiIntroduce = xapi.calls.find(([method]) => method === 'VDI.introduce')
    assert.equal(vdiIntroduce[7], false) // read_only
  })

  it('keeps its VDI out of the backups and snapshots of this appliance', async () => {
    const { mixin } = makeMixin()
    const xapi = makeXapi()

    await mountDisk(mixin, xapi, { ...CACHE, xapiLabels: { vdiNameLabel: 'system' } })

    const vdiCreate = xapi.calls.find(([method]) => method === 'VDI_create')[1]
    assert.equal(vdiCreate.name_label, '[XO live restore] [NOBAK] [NOSNAP] system')
  })

  it('refuses an SR not plugged on the host running this appliance, having created nothing', async () => {
    const { mixin, disk } = makeMixin()
    const xapi = makeXapi({ cacheSrPluggedOn: 'OpaqueRef:another-host' })

    await assert.rejects(mountDisk(mixin, xapi, CACHE), /not plugged on the host running this appliance/)
    assert.ok(!xapi.calls.some(([method]) => method === 'VDI_create'))
    assert.equal(disk.closed, true)
  })

  it('waits for the device node of the hot-plugged VDI to appear', async () => {
    const enoent = Object.assign(new Error('not there yet'), { code: 'ENOENT' })
    const { mixin, cacheDevice } = makeMixin({ cacheDeviceOpenErrors: [enoent] })

    await mountDisk(mixin, makeXapi(), CACHE)

    assert.equal(cacheDevice.opened, true)
  })

  it('does not wait on a device which will never open, and destroys its VDI', async () => {
    const eacces = Object.assign(new Error('permission denied'), { code: 'EACCES' })
    const { mixin, cacheDevice } = makeMixin({ cacheDeviceOpenErrors: [eacces] })
    const xapi = makeXapi()

    await assert.rejects(mountDisk(mixin, xapi, CACHE), { code: 'EACCES' })

    assert.equal(cacheDevice.opened, false)
    assert.ok(xapi.calls.some(([method, ref]) => method === 'VDI_destroy' && ref === CACHE_VDI_REF))
  })

  it('serves a read from the source once, then from the cache', async () => {
    const { mixin, target, disk } = makeMixin()
    disk.hasBlock = () => true
    disk.readBlock = async index => {
      disk.readBlocks.push(index)
      return { index, data: Buffer.alloc(disk.getBlockSize(), 0x5a) }
    }
    disk.readBlocks = []

    await mountDisk(mixin, makeXapi(), CACHE)

    const lun = target.options.lun
    assert.deepEqual(await lun.read(0, 512), Buffer.alloc(512, 0x5a))
    assert.deepEqual(disk.readBlocks, [0])
    // the whole point: a second read of the same block does not go back out
    assert.deepEqual(await lun.read(512, 512), Buffer.alloc(512, 0x5a))
    assert.deepEqual(disk.readBlocks, [0])
  })

  it('requires the VM of this appliance, having created nothing', async () => {
    const { mixin } = makeMixin()
    const xapi = makeXapi()
    await assert.rejects(mountDisk(mixin, xapi, { cacheSrUuid: CACHE_SR_UUID }), /vmUuid is required/)
    assert.deepEqual(xapi.calls, [])
  })

  it('explains that this appliance belongs to another pool, having created nothing', async () => {
    const { mixin } = makeMixin()
    const xapi = makeXapi()
    await assert.rejects(
      mountDisk(mixin, xapi, { ...CACHE, vmUuid: 'vm-of-another-pool' }),
      /not a VM of the pool the disk is mounted onto/
    )
    assert.ok(!xapi.calls.some(([method]) => method === 'VDI_create'))
  })

  describe('unwinds what it created when the mount fails later', () => {
    it('on a failing SCSI probe, closing the device before destroying the VBD', async () => {
      const { mixin, cacheDevice, events, disk } = makeMixin()
      const xapi = makeXapi({ events, probeError: new Error('probe blew up') })

      await assert.rejects(mountDisk(mixin, xapi, CACHE), /probe blew up/)

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

      await assert.rejects(mountDisk(mixin, xapi, CACHE), /no free slot/)

      assert.deepEqual(events, ['cache VDI created', 'cache VDI destroyed'])
      assert.equal(disk.closed, true)
    })

    it('on a VBD with an unusable device name, destroying both', async () => {
      const { mixin, cacheDevice, events } = makeMixin()
      const xapi = makeXapi({ events, vbdDevice: '' })

      await assert.rejects(mountDisk(mixin, xapi, CACHE), /unusable device name/)

      assert.deepEqual(events, ['cache VDI created', 'cache VBD created', 'cache VBD destroyed', 'cache VDI destroyed'])
      assert.equal(cacheDevice.opened, false)
    })
  })

  it('tears the cache down in an order which cannot leak the VDI', async () => {
    const { mixin, events } = makeMixin()
    const xapi = makeXapi({ events })

    const { id } = await mountDisk(mixin, xapi, CACHE)
    events.length = 0
    await mixin.unmountDisk(id)

    // the descriptor must be closed before the VBD is unplugged, or the kernel
    // refuses to release the device and the VDI stays behind
    assert.deepEqual(events, ['target closed', 'cache device closed', 'cache VBD destroyed', 'cache VDI destroyed'])
  })

  it('destroys the VDI even when closing the target failed', async () => {
    const { mixin, target, events } = makeMixin()
    const xapi = makeXapi({ events })

    const { id } = await mountDisk(mixin, xapi, CACHE)
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
      ...CACHE,
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

    await mountDisk(mixin, xapi, CACHE)
    const [cached] = mixin.listMountedDisks()
    assert.deepEqual(cached.cache, { blocks: 0, total: DISK_SIZE / (2 * 1024 * 1024) })

    await mountDisk(mixin, xapi)
    const uncached = mixin.listMountedDisks()[1]
    assert.equal(uncached.cache, undefined)
  })
})
