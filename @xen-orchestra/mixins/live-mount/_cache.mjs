import { createLogger } from '@xen-orchestra/log'

import { cacheLabel } from './_utils.mjs'

const { info } = createLogger('xo:mixins:LiveMount')

// identifies the VDIs we created, so a leftover after a hard kill is recognizable
const OC_MOUNT = 'xo:live-mount'

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
 * @param {string} params.diskPath - path of the source disk, for the labels
 * @param {string} params.id - id of the mount
 * @param {string} params.srUuid - SR holding the cache VDI
 * @param {string} params.vmUuid - VM of this appliance, the cache VDI is plugged onto it
 * @param {(options: { path: string, size: number }) => object} params.createCacheDevice
 * @returns {Promise<{ device: object, vbdRef: string, vdiRef: string }>}
 */
export async function createCache($defer, { xapi, disk, diskPath, id, srUuid, vmUuid, createCacheDevice }) {
  const vmRef = await xapi.call('VM.get_by_uuid', vmUuid)
  const srRef = await xapi.call('SR.get_by_uuid', srUuid)

  const vdiRef = await xapi.VDI_create({
    name_description: `read cache of the live mount of ${diskPath}`,
    name_label: `[XO live mount cache] ${cacheLabel(diskPath)}`,
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

  // the device node may lag behind the plug, `open()` retries until udev created it
  const device = createCacheDevice({ path, size })
  await device.open()
  $defer.onFailure(() => device.close())

  info('cache attached', { device: path, diskPath, id, size })

  return { device, vbdRef, vdiRef }
}
