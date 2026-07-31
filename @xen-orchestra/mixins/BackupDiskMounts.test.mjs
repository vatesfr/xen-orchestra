import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { EventEmitter } from 'node:events'

import BackupDiskMounts from './BackupDiskMounts.mjs'

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

const makeMixin = ({ diskOpenError, listenError } = {}) => {
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

  const mixin = new BackupDiskMounts(app, {
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
  })

  return { app, disk, hooks, mixin, target }
}

const mount = (mixin, xapi, params) =>
  mixin.mount({ diskPath: 'xo-vm-backups/vm/vdis/job/vdi/20260731T120000Z.vhd', hostRef: HOST_REF, xapi, ...params })

describe('mount', () => {
  it('serves the chain and attaches it as a non-shared iscsi SR on the host', async () => {
    const { mixin, target, disk } = makeMixin()
    const xapi = makeXapi()

    const result = await mount(mixin, xapi)

    // the SR uuid is ours, since we introduce the SR instead of creating it
    assert.equal(result.srUuid, xapi.calls.find(([method]) => method === 'SR.introduce')[1])
    assert.match(result.srUuid, /^[0-9a-f-]{36}$/)
    assert.equal(result.vdiUuid, 'vdi-uuid')
    assert.equal(result.address, '192.168.1.8')
    assert.equal(result.port, 34567)
    assert.match(result.iqn, /^iqn\.2026-07\.tech\.vates\.xo:backup-[0-9a-f]{32}$/)

    // the chain is opened with its block allocation tables
    assert.equal(disk.params.path, 'xo-vm-backups/vm/vdis/job/vdi/20260731T120000Z.vhd')
    assert.equal(disk.params.ignoreBlockIndexes, undefined)

    // one ephemeral target per mount, CHAP enabled, unique serial
    assert.equal(target.options.port, 0)
    assert.equal(target.options.iqn, result.iqn)
    assert.equal(target.options.chap.secret.length, 16)
    assert.equal(target.options.identity.serial, `xo-backup-${result.id}`)

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
        ['xo:backup-disk-mount', result.id],
        ['auto-scan', 'false'],
      ]
    )
    // VDI.read_only is StaticRO in XAPI: nothing may try to set it
    assert.ok(!xapi.calls.some(([method]) => method === 'VDI.set_read_only'))

    assert.deepEqual(
      mixin.list().map(({ id, srUuid, vdiUuid }) => ({ id, srUuid, vdiUuid })),
      [{ id: result.id, srUuid: result.srUuid, vdiUuid: 'vdi-uuid' }]
    )
  })

  it('reports an unreachable target as a configuration problem', async () => {
    const { mixin } = makeMixin()
    const xapi = makeXapi({ probeError: new XapiError('SR_BACKEND_FAILURE_141', []) })

    await assert.rejects(mount(mixin, xapi), /cannot reach the iSCSI target at 192\.168\.1\.8/)
  })

  it('closes the target and the disk when the probe fails', async () => {
    const { mixin, target, disk } = makeMixin()
    const xapi = makeXapi({ probeError: new XapiError('SR_BACKEND_FAILURE_666', []) })

    await assert.rejects(mount(mixin, xapi), { code: 'SR_BACKEND_FAILURE_666' })

    assert.equal(target.closed, true)
    assert.equal(disk.closed, true)
    assert.deepEqual(mixin.list(), [])
  })

  it('closes the disk when the target cannot listen', async () => {
    const { mixin, disk } = makeMixin({ listenError: new Error('EADDRINUSE') })

    await assert.rejects(mount(mixin, makeXapi()), /EADDRINUSE/)

    assert.equal(disk.closed, true)
  })
})

describe('unmount', () => {
  it('unplugs, forgets, closes the target and releases the caller resources', async () => {
    const { mixin, target } = makeMixin()
    const xapi = makeXapi()
    let released = false

    const { id } = await mount(mixin, xapi, { release: async () => (released = true) })
    xapi.calls.length = 0

    await mixin.unmount(id)

    assert.deepEqual(
      xapi.calls.map(([method]) => method),
      ['SR.get_PBDs', 'PBD.unplug', 'SR.forget']
    )
    assert.equal(target.closed, true)
    assert.equal(released, true)
    assert.deepEqual(mixin.list(), [])
  })

  it('still closes the target when forgetting the SR fails', async () => {
    const { mixin, target } = makeMixin()
    const xapi = makeXapi()
    const { id } = await mount(mixin, xapi)
    xapi.call = async () => {
      throw new Error('SR_HAS_NO_PBDS')
    }

    await assert.rejects(mixin.unmount(id), /SR_HAS_NO_PBDS/)

    assert.equal(target.closed, true)
    // the mount is gone either way, a half-released mount must not be retried
    assert.deepEqual(mixin.list(), [])
  })

  it('rejects an unknown mount', async () => {
    const { mixin } = makeMixin()
    await assert.rejects(mixin.unmount('nope'), /no such backup disk mount nope/)
  })
})

describe('the stop hook', () => {
  it('tears down every live mount', async () => {
    const { mixin, hooks, target } = makeMixin()
    await mount(mixin, makeXapi())

    await Promise.all(hooks.listeners('stop').map(listener => listener()))

    assert.equal(target.closed, true)
    assert.deepEqual(mixin.list(), [])
  })
})
