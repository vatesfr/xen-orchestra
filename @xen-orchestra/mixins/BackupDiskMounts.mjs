import { access, constants, readFile } from 'node:fs/promises'
import { asyncEach } from '@vates/async-each'
import { CachedDiskBlockDevice, IscsiTarget } from '@vates/iscsi'
import { createLogger } from '@xen-orchestra/log'
import { defer } from 'golike-defer'
import { openDiskChain } from '@xen-orchestra/backup-archive/disks'
import { randomBytes, randomUUID } from 'node:crypto'
import { XMLParser } from 'fast-xml-parser'
import pRetry from 'promise-toolbox/retry'

import LocalBlockDevice from './_LocalBlockDevice.mjs'

const { debug, info, warn } = createLogger('xo:mixins:BackupDiskMounts')

// SR.probe() answers the LUN list through a fault instead of a result when the
// device config does not name a SCSIid yet.
const PROBE_LUN_LIST_ERROR = 'SR_BACKEND_FAILURE_107'
const PROBE_NO_TARGET_ERROR = 'SR_BACKEND_FAILURE_141'

// The probe only performs iSCSI discovery, so `lvmoiscsi` is usable to enumerate
// LUNs whatever SR type is created afterwards.
const PROBE_SR_TYPE = 'lvmoiscsi'

// Raw "LUN per VDI" driver: the LUN becomes a VDI as-is, with no LVM written to
// it — the only iSCSI SR type usable on a read-only LUN.
const SR_TYPE = 'iscsi'

// identifies the SRs we created, to recognize leftovers
const OC_MOUNT = 'xo:backup-disk-mount'

// Our target exposes exactly one LUN, numbered 0.
const LUN_ID = '0'

// The LUN is the guest's disk content as-is. `sm_config` can only be set when a
// VDI is introduced, never afterwards (it is StaticRO), which is the reason this
// mixin introduces the VDI itself instead of letting a scan do it.
const IMAGE_FORMAT_RAW = 'raw'

// open-iscsi refuses a CHAP secret outside 12-16 characters
const CHAP_SECRET_LENGTH = 16

// the cache device node is created by udev after the plug, so it lags a little
const DEVICE_POLL_DELAY = 500
const DEVICE_POLL_TRIES = 60

// `/sys/class/block/<name>/size` counts 512-byte sectors, always
const SECTOR_SIZE = 512

// the LUN serves the *content* of the chain, not the VHD container, so a label
// must not keep the `.vhd`/`.alias.vhd` suffix of the source file: it would
// suggest a format the storage layer would then read differently
const cacheLabel = diskPath =>
  diskPath
    .split('/')
    .pop()
    .replace(/(\.alias)?\.vhd$/, '')

/**
 * Open the block device XAPI just plugged into this appliance.
 *
 * Waiting for the node to appear is not enough: udev creates it as soon as the
 * device is announced, but until the block frontend has connected the device
 * reports a size of 0 and every read hits EOF at once. So wait for a size
 * instead — `/sys` counts it in 512-byte sectors whatever the device's own
 * logical block size is.
 */
async function openLocalDevice({ name, size }) {
  const path = `/dev/${name}`
  const actual = await pRetry(
    async () => {
      await access(path, constants.R_OK | constants.W_OK)
      const sectors = Number.parseInt(await readFile(`/sys/class/block/${name}/size`, 'utf8'), 10)
      const bytes = sectors * SECTOR_SIZE
      if (!(bytes > 0)) {
        throw new Error(`${path} is not ready yet, it still reports no size`)
      }
      return bytes
    },
    {
      delay: DEVICE_POLL_DELAY,
      tries: DEVICE_POLL_TRIES,
      onRetry: error => debug('waiting for the cache device', { error, path }),
    }
  )
  if (actual < size) {
    throw new Error(`${path} holds ${actual} bytes, less than the ${size} bytes disk it is meant to cache`)
  }

  const device = new LocalBlockDevice({ path, size })
  await device.open()
  return device
}

const parseXml = (() => {
  const parser = new XMLParser({
    attributeNamePrefix: '',
    ignoreAttributes: false,
    ignoreDeclaration: true,
    parseTagValue: false,
    parseAttributeValue: false,
  })
  return xml => parser.parse(Buffer.isBuffer(xml) ? xml.toString() : xml)
})()

/**
 * Serve one disk of a backup as a read-only iSCSI LUN and attach it to a host
 * as an SR, so the backup content shows up as a VDI without being copied.
 *
 * Nothing app-specific is read from `app` apart from `config` and `hooks`: the
 * remote handler, the XAPI connection and the host are passed in by the caller,
 * so both xo-server and xo-proxy can use this mixin.
 */
export default class BackupDiskMounts {
  #app
  #createTarget
  #openCache
  #openDisk

  // mount id -> mount record
  #mounts = new Map()

  // `openDisk`/`createTarget`/`openCache` are injectable for tests only, like
  // xo-server's crypto-credentials mixin does with xenStore/fsPromises
  constructor(
    app,
    { openDisk = openDiskChain, createTarget = options => new IscsiTarget(options), openCache = openLocalDevice } = {}
  ) {
    this.#app = app
    this.#createTarget = createTarget
    this.#openCache = openCache
    this.#openDisk = openDisk

    app.hooks.on('stop', () =>
      asyncEach(
        [...this.#mounts.keys()],
        id =>
          this.unmount(id).catch(error => {
            warn('failed to unmount on stop', { error, id })
          }),
        { stopOnError: false }
      )
    )
  }

  /**
   * @param {object} params
   * @param {import('@xen-orchestra/fs').RemoteHandlerAbstract} params.handler - backup repository holding the disk
   * @param {string} params.diskPath - path of the leaf VHD of the chain, relative to the repository
   * @param {object} params.xapi - XAPI connection of the pool running this appliance
   * @param {string} params.vmRef - opaque ref of *this* appliance's VM, where the cache disk is plugged
   * @param {string} params.cacheSrRef - opaque ref of the SR holding the cache disk; must be writable and
   * reachable from the appliance's host, which is the caller's job to check
   * @param {string} [params.nameLabel] - name of the created SR
   * @param {() => Promise<void>} [params.release] - called on unmount, e.g. to dispose the remote handler
   * @returns {Promise<{ id: string, srUuid: string, vdiUuid: string, cacheVdiUuid: string, iqn: string, address: string, port: number }>}
   */
  async mount(params) {
    const mount = await this.#createMount(params)
    this.#mounts.set(mount.id, mount)
    return {
      id: mount.id,
      srUuid: mount.srUuid,
      vdiUuid: mount.vdiUuid,
      cacheVdiUuid: mount.cacheVdiUuid,
      iqn: mount.iqn,
      address: mount.address,
      port: mount.port,
    }
  }

  #createMount = defer(async ($defer, { handler, diskPath, xapi, vmRef, cacheSrRef, nameLabel, release }) => {
    const config = this.#app.config
    const address = config.get('iscsi.advertisedAddress')

    const id = randomBytes(16).toString('hex')
    const iqn = `iqn.2026-07.tech.vates.xo:backup-${id}`
    const chap = {
      user: `xo-${id.slice(0, 8)}`,
      secret: randomBytes(CHAP_SECRET_LENGTH).toString('base64url').slice(0, CHAP_SECRET_LENGTH),
    }

    // the chain must keep its block allocation tables: they tell which blocks
    // are allocated, and reading an unallocated one throws
    const disk = await this.#openDisk({ handler, path: diskPath })
    $defer.onFailure(() => disk.close())

    // the appliance's host: the mount is served to whichever host runs us
    const hostRef = await xapi.getField('VM', vmRef, 'resident_on')

    const cache = await this.#createCache($defer, {
      diskPath,
      size: disk.getVirtualSize(),
      srRef: cacheSrRef,
      vmRef,
      xapi,
    })

    // the cache owns the reads: the backup is only ever touched for a block that
    // is not in it yet
    const lun = new CachedDiskBlockDevice({ cache: cache.device, disk })
    const target = this.#createTarget({
      chap,
      host: config.getOptional('iscsi.bindAddress'),
      identity: { serial: `xo-backup-${id}` },
      iqn,
      lun,
      port: 0, // ephemeral: one target per mount
    })
    // opens the LUN, so its capacity is readable afterwards
    await target.listen()
    $defer.onFailure(() => target.close())
    const { port } = target.address()

    const deviceConfig = {
      chapuser: chap.user,
      chappassword: chap.secret,
      port: String(port),
      target: address,
      targetIQN: iqn,
    }

    const SCSIid = await this.#probeScsiId({ xapi, hostRef, deviceConfig, address })
    const fullDeviceConfig = { ...deviceConfig, SCSIid }

    // Introduce the SR rather than create it: SR.create would scan, and a scan
    // introduces the VDI itself, with an sm_config we cannot amend afterwards.
    const srUuid = randomUUID()
    const srRef = await xapi.call(
      'SR.introduce',
      srUuid,
      nameLabel ?? `[XO backup] ${id.slice(0, 8)}`,
      `read-only mount of ${diskPath}`,
      SR_TYPE,
      'user',
      false, // not shared: this mount serves a single host
      {}
    )
    $defer.onFailure(() => xapi.call('SR.forget', srRef))

    const pbdRef = await xapi.call('PBD.create', {
      host: hostRef,
      SR: srRef,
      device_config: fullDeviceConfig,
    })
    await xapi.call('PBD.plug', pbdRef)
    $defer.onFailure(() => this.#forgetSr(xapi, srRef))

    await xapi.setFieldEntry('SR', srRef, 'other_config', OC_MOUNT, id)
    // A scan would introduce the LUN as a VDI on its own, with an sm_config we
    // could no longer amend, so make sure none is triggered at boot. Unlike with
    // `SR_create`, nothing else writes this key here.
    await xapi.setFieldEntry('SR', srRef, 'other_config', 'auto-scan', 'false')

    const vdiUuid = await this.#introduceVdi({ xapi, srRef, SCSIid, size: lun.getSize(), diskPath })

    info('mounted', { id, address, port, srUuid, vdiUuid, cacheVdiUuid: cache.vdiUuid, diskPath })

    return {
      address,
      cache,
      cacheVdiUuid: cache.vdiUuid,
      disk,
      diskPath,
      id,
      iqn,
      lun,
      port,
      release,
      srRef,
      srUuid,
      target,
      vdiUuid,
      xapi,
    }
  })

  /**
   * Create the disk backing the cache and plug it into this appliance, so its
   * bytes are reachable as a local block device.
   *
   * This is the only random-access write path into a VDI: XAPI's NBD export is
   * read-only, and `VDI_importContent` is a whole-stream HTTP PUT.
   *
   * @returns {Promise<{ device: object, vbdRef: string, vdiRef: string, vdiUuid: string }>}
   */
  async #createCache($defer, { diskPath, size, srRef, vmRef, xapi }) {
    const vdiRef = await xapi.VDI_create({
      name_description: `read cache for ${diskPath}`,
      name_label: `${cacheLabel(diskPath)}.raw`,
      SR: srRef,
      virtual_size: size,
    })
    $defer.onFailure(() => xapi.VDI_destroy(vdiRef))

    // `throwVbdPlug` is not optional here: without it VBD_create only warns when
    // the plug fails, and we would carry on with a disk that is not attached
    const vbdRef = await xapi.VBD_create({ mode: 'RW', throwVbdPlug: true, type: 'Disk', VDI: vdiRef, VM: vmRef })
    $defer.onFailure(() => xapi.VBD_destroy(vbdRef))

    // read back after the plug: the device name passed to VBD.create is ignored
    // for a running VM, XAPI assigns it
    const name = await xapi.getField('VBD', vbdRef, 'device')
    if (name === '') {
      throw new Error(`XAPI did not assign a device to the cache disk of ${diskPath}`)
    }

    const device = await this.#openCache({ name, size })
    $defer.onFailure(() => device.close())

    const vdiUuid = await xapi.getField('VDI', vdiRef, 'uuid')
    info('cache disk plugged', { device: name, size, vdiUuid })

    return { device, vbdRef, vdiRef, vdiUuid }
  }

  /**
   * Introduce the LUN as a VDI ourselves, which is the only way to choose its
   * `sm_config`: that field is StaticRO, so a scan-introduced VDI could never be
   * amended afterwards.
   *
   * `LUNid` is what the driver needs to find the device; it fills `SCSIid` and
   * `backend-kind` in itself, keeping the keys we pass.
   *
   * `read_only` is false: writes are accepted and land in the cache disk. The
   * driver would ignore the flag anyway — `RAWVDI.introduce()` ends in
   * `_db_introduce()`, which builds the record from the driver's own VDI object,
   * the same reason the resulting uuid is not the one asked for.
   */
  async #introduceVdi({ xapi, srRef, SCSIid, size, diskPath }) {
    const uuid = randomUUID()
    await xapi.call(
      'VDI.introduce',
      uuid,
      `${cacheLabel(diskPath)}.raw`,
      `mount of ${diskPath}`,
      srRef,
      'user',
      false, // sharable
      false, // read_only: writes go to the cache disk
      {}, // other_config
      uuid, // location: this driver uses the uuid
      {}, // xenstore_data
      { LUNid: LUN_ID, SCSIid, type: IMAGE_FORMAT_RAW },
      true, // managed
      size,
      0, // physical_utilisation: nothing is allocated locally
      'OpaqueRef:NULL', // metadata_of_pool
      false, // is_a_snapshot
      '19700101T00:00:00Z', // snapshot_time
      'OpaqueRef:NULL' // snapshot_of
    )

    // The driver derives the VDI uuid from the LUN's serial, so the record may
    // not carry the uuid we asked for: resolve it by SCSIid instead.
    const vdiRefs = await xapi.call('SR.get_VDIs', srRef)
    for (const vdiRef of vdiRefs) {
      const vdi = await xapi.getRecord('VDI', vdiRef)
      if (vdi.sm_config.SCSIid !== SCSIid) {
        continue
      }
      // the whole record, to check what the driver kept of what we asked for
      debug('introduced VDI', vdi)
      if (vdi.uuid !== uuid) {
        info('the driver renamed the introduced VDI', { asked: uuid, got: vdi.uuid })
      }
      return vdi.uuid
    }
    warn('no VDI found for the introduced LUN', { SCSIid, srRef })
  }

  /**
   * Ask the host which SCSIid it computes for our LUN. Passing an incomplete
   * device config makes SR.probe() answer with a fault holding the LUN list.
   */
  async #probeScsiId({ xapi, hostRef, deviceConfig, address }) {
    let xml
    try {
      const probed = await xapi.call('SR.probe', hostRef, deviceConfig, PROBE_SR_TYPE, {})
      // it answers the LUN list through a fault, so a plain result is unexpected
      warn('SR.probe returned instead of reporting the LUN list', { probed })
      throw new Error('SR.probe should have reported the LUN list')
    } catch (error) {
      if (error.code === PROBE_NO_TARGET_ERROR) {
        const wrapped = new Error(`the host cannot reach the iSCSI target at ${address}, check iscsi.advertisedAddress`)
        wrapped.cause = error
        throw wrapped
      }
      if (error.code !== PROBE_LUN_LIST_ERROR) {
        throw error
      }
      xml = parseXml(error.params[2])
    }

    const luns = xml['iscsi-target']?.LUN
    const lun = Array.isArray(luns) ? luns[0] : luns
    const SCSIid = lun?.SCSIid?.trim()
    if (SCSIid === undefined || SCSIid === '') {
      throw new Error(`no LUN reported by the host for target ${deviceConfig.targetIQN}`)
    }
    return SCSIid
  }

  // SR.forget rather than SR.destroy: the LUN content must not be touched
  async #forgetSr(xapi, srRef) {
    const pbdRefs = await xapi.call('SR.get_PBDs', srRef)
    await asyncEach(pbdRefs, pbdRef => xapi.call('PBD.unplug', pbdRef), { stopOnError: false })
    await xapi.call('SR.forget', srRef)
  }

  /**
   * Detach a mount from its host and stop serving it.
   *
   * @param {string} id - identifier returned by {@link BackupDiskMounts#mount}
   */
  async unmount(id) {
    const mount = this.#mounts.get(id)
    if (mount === undefined) {
      throw new Error(`no such backup disk mount ${id}`)
    }
    // drop it first, so a failing teardown cannot be retried against a
    // half-released mount
    this.#mounts.delete(id)

    const { cache, xapi, srRef, target, release } = mount

    // Ordered, and each step runs even if an earlier one failed: a mount holds a
    // socket, a file descriptor, a VBD, a VDI and an SR, and giving up halfway
    // would leak whatever came after.
    const errors = []
    const step = async (what, fn) => {
      try {
        await fn()
      } catch (error) {
        warn(`failed to ${what}`, { error, id })
        errors.push(error)
      }
    }

    await step('forget the SR', () => this.#forgetSr(xapi, srRef))
    // stop serving first, so no I/O is left in flight
    await step('close the target', () => target.close())
    // the LUN closes the cache device too; doing it again is a no-op, and makes
    // sure the descriptor is gone before XAPI is asked to take the disk away
    await step('close the cache device', () => cache.device.close())
    // unplugs on the way, and the VDI destroy retries on VDI_IN_USE
    await step('destroy the cache VBD', () => xapi.VBD_destroy(cache.vbdRef))
    await step('destroy the cache VDI', () => xapi.VDI_destroy(cache.vdiRef))
    await step('release the caller resources', () => release?.())

    if (errors.length !== 0) {
      const error = new Error(`failed to unmount backup disk ${id}`)
      error.cause = errors[0]
      error.errors = errors
      throw error
    }
    info('unmounted', { id, srUuid: mount.srUuid, cacheVdiUuid: mount.cacheVdiUuid })
  }

  /** Live mounts, in creation order. */
  list() {
    return [...this.#mounts.values()].map(
      ({ id, srUuid, vdiUuid, cacheVdiUuid, diskPath, iqn, address, port, lun }) => ({
        id,
        srUuid,
        vdiUuid,
        cacheVdiUuid,
        diskPath,
        iqn,
        address,
        port,
        // how much of the backup has been pulled into the cache: once every block
        // is there, the cache disk holds the whole disk
        materialized: lun.getMaterialized(),
      })
    )
  }
}
