import { createLogger } from '@xen-orchestra/log'
import pRetry from 'promise-toolbox/retry'

import { OC_MOUNT } from './_utils.mjs'

const { debug, info } = createLogger('xo:mixins:LiveMount')

// what a freshly hot-plugged device may answer while it settles: the node may not be there yet
// (udev), the kernel may not have attached the backend yet, or a scanner (`blkid`,
// `systemd-udevd`) may still hold it exclusively
const TRANSIENT_OPEN_ERRORS = ['EBUSY', 'ENOENT', 'ENOMEDIUM', 'ENXIO']

/**
 * Create a VDI the size of the source disk, hot-plug it onto the appliance's VM
 * and open it as a block device.
 *
 * Everything is registered on the caller's `$defer`, so a failure later in the
 * mount unwinds it too.
 *
 * @param {object} $defer - the caller's golike-defer handle
 * @param {object} params
 * @param {object} params.xapi - XAPI connection of the pool the disk is mounted onto
 * @param {object} params.disk - the source disk, already opened
 * @param {string} params.diskPath - path of the source disk, for the logs
 * @param {string} params.id - id of the mount
 * @param {string} params.nameLabel - name of the disk being restored
 * @param {string} params.srUuid - SR holding the cache VDI
 * @param {string} params.vmUuid - VM of this appliance, the cache VDI is plugged onto it
 * @param {(options: { path: string, size: number }) => object} params.createCacheDevice
 * @returns {Promise<{ device: object, vbdRef: string, vdiRef: string }>}
 */
export async function createCache($defer, { xapi, disk, diskPath, id, nameLabel, srUuid, vmUuid, createCacheDevice }) {
  const vmRef = await xapi.call('VM.get_by_uuid', vmUuid)
  const srRef = await xapi.call('SR.get_by_uuid', srUuid)

  // checked upfront, so a wrong SR fails with its name rather than as a plug failure, after a VDI
  // was created for nothing: shared SRs are plugged on every host of their pool, local ones on
  // their own host only
  const hostRef = xapi.getObjectByRef(vmRef).resident_on
  const sr = xapi.getObjectByRef(srRef)
  if (!sr.$PBDs.some(pbd => pbd.host === hostRef && pbd.currently_attached)) {
    throw new Error(
      `the SR ${srUuid} is not plugged on the host running this appliance: pick a shared SR of its pool, or a local SR of this host`
    )
  }

  // `[NOBAK]` and `[NOSNAP]` keep it out of the backups and snapshots of this appliance
  const vdiRef = await xapi.VDI_create({
    name_description: `Holds the data of the live restore of ${nameLabel}. Attached to this appliance: do not detach or delete it while the restore runs.`,
    name_label: `[XO live restore] [NOBAK] [NOSNAP] ${nameLabel}`,
    other_config: { [OC_MOUNT]: id },
    SR: srRef,
    virtual_size: disk.getVirtualSize(),
  })
  $defer.onFailure(() => xapi.VDI_destroy(vdiRef))

  // without `throwVbdPlug`, a plug failure is only logged
  const vbdRef = await xapi.VBD_create({
    mode: 'RW',
    throwVbdPlug: true,
    type: 'Disk',
    unpluggable: true,
    VDI: vdiRef,
    VM: vmRef,
  })
  $defer.onFailure(() => xapi.VBD_destroy(vbdRef))

  // the VBD is plugged, the barrier makes its `device` visible in the object cache
  const { device: deviceName } = await xapi.barrier(vbdRef)
  if (!/^[a-z0-9]+$/i.test(deviceName ?? '')) {
    throw new Error(`unusable device name for the cache VBD ${vbdRef}: ${JSON.stringify(deviceName)}`)
  }
  const path = `/dev/${deviceName}`
  // XAPI may have rounded the size up to the SR allocation quantum
  const size = Number(xapi.getObjectByRef(vdiRef).virtual_size)

  const device = createCacheDevice({ path, size })
  // the device node may lag behind the plug
  await pRetry(() => device.open(), {
    delay: 200,
    tries: 10,
    when: error => TRANSIENT_OPEN_ERRORS.includes(error.code),
    onRetry: error => debug('cache device not ready yet, retrying', { code: error.code, path }),
  })
  $defer.onFailure(() => device.close())

  info('cache attached', { device: path, diskPath, id, size })

  return { device, vbdRef, vdiRef }
}
