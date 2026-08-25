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

const makeXapi = ({ probeError, vdiSmConfig } = {}) => {
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
      if (type === 'host' && field === 'address') {
        return '10.20.30.40' // the host's own management address, as XAPI reports it
      }
      return 'sr-uuid'
    },
    async getRecord(type, ref) {
      calls.push(['getRecord', type, ref])
      // the driver derives the VDI uuid from the LUN serial, so it differs from
      // the one we asked for
      return { uuid: 'vdi-uuid', sm_config: vdiSmConfig ?? { SCSIid: SCSI_ID } }
    },
  }
}

const makeMixin = ({ diskOpenError, listenError, advertisedAddress = '192.168.1.8' } = {}) => {
  const hooks = new EventEmitter()
  const detectAddressCalls = []
  const app = {
    config: {
      getOptional: path => {
        if (path === 'iscsi.advertisedAddress') {
          // `null` (as opposed to the default) simulates an unset config key
          return advertisedAddress === null ? undefined : advertisedAddress
        }
        assert.equal(path, 'iscsi.bindAddress')
        return undefined
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
    close: async () => (target.closed = true),
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
  })

  return { app, detectAddressCalls, disk, hooks, mixin, target }
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
    xapi.call = async () => {
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
