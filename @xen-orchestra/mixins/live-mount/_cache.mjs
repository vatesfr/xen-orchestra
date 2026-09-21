import { createLogger } from '@xen-orchestra/log'

import { cacheLabel } from './_utils.mjs'
import { resolveSelfVmRef } from './_self.mjs'

const { info } = createLogger('xo:mixins:LiveMount')

// what XAPI answers for a field holding no reference
const NULL_REF = 'OpaqueRef:NULL'

// identifies the VDIs we created, so a leftover after a hard kill is recognizable
const OC_MOUNT = 'xo:live-mount'

/**
 * What the caller asked for, merged with the configured defaults, or
 * `undefined` when this mount gets no cache at all.
 *
 * @param {boolean | { srUuid?: string, hydrate?: boolean } | undefined} cache
 * @param {object} config - the app config, for the `iscsi.cache*` keys
 * @returns {undefined | { srUuid: string | undefined, hydrate: boolean }}
 */
export function normalizeCacheOptions(cache, config) {
  if (cache === undefined) {
    cache = config.getOptional('iscsi.cache') ?? false
  }
  if (cache === false) {
    return undefined
  }
  if (cache === true) {
    cache = {}
  }
  return {
    srUuid: cache.srUuid ?? config.getOptional('iscsi.cacheSr'),
    hydrate: cache.hydrate ?? config.getOptional('iscsi.cacheHydrate') ?? false,
  }
}

/**
 * The SR the cache VDI is created on: the one asked for, else the pool's
 * default.
 *
 * Whether it is actually reachable from the host this appliance runs on is not
 * checked here — that duplicates XAPI's own logic and gets it subtly wrong. It
 * surfaces as a plug failure instead, which names the SR.
 */
export async function resolveCacheSr(xapi, srUuid) {
  if (srUuid !== undefined) {
    return xapi.call('SR.get_by_uuid', srUuid)
  }
  const [poolRef] = await xapi.call('pool.get_all')
  const srRef = await xapi.call('pool.get_default_SR', poolRef)
  if (srRef === undefined || srRef === NULL_REF) {
    throw new Error('no SR to hold the live mount cache: this pool has no default SR, set iscsi.cacheSr')
  }
  return srRef
}

/**
 * Give this mount somewhere local to materialize the disk into: a VDI the size
 * of the source, hot-plugged onto this appliance's own VM, opened as the block
 * device it surfaces as.
 *
 * Everything it creates is registered on the caller's `$defer`, not on one of
 * its own, so a failure *later* in the mount — the SCSI probe, the SR, the VDI
 * introduced on the host — unwinds it too.
 *
 * @param {object} $defer - the caller's golike-defer handle
 * @param {object} params
 * @param {object} params.xapi - XAPI connection of the pool the disk is mounted onto
 * @param {object} params.disk - the source disk, already opened
 * @param {string} params.diskPath - path of the source disk, for the labels
 * @param {string} params.id - id of the mount
 * @param {{ srUuid?: string }} params.cacheOptions - from {@link normalizeCacheOptions}
 * @param {() => Promise<string>} params.getSelfVmUuid
 * @param {(options: { path: string, size: number }) => object} params.createCacheDevice
 * @param {(xapi: object, vbdRef: string) => Promise<string>} params.waitForVbdDevice
 * @returns {Promise<{ device: object, vbdRef: string, vdiRef: string }>}
 */
export async function createCache(
  $defer,
  { xapi, disk, diskPath, id, cacheOptions, getSelfVmUuid, createCacheDevice, waitForVbdDevice }
) {
  const vmRef = await resolveSelfVmRef(xapi, await getSelfVmUuid())
  const srRef = await resolveCacheSr(xapi, cacheOptions.srUuid)

  // XAPI rounds the size up to the SR's allocation quantum, which is fine: the
  // cache only has to be *at least* as large as the disk
  const vdiRef = await xapi.VDI_create({
    name_description: `read cache of the live mount of ${diskPath}`,
    name_label: `[XO live mount cache] ${cacheLabel(diskPath)}`,
    other_config: { [OC_MOUNT]: id },
    SR: srRef,
    virtual_size: disk.getVirtualSize(),
  })
  $defer.onFailure(() => xapi.VDI_destroy(vdiRef))

  // `throwVbdPlug` because VBD_create otherwise only warns on a plug failure and
  // still answers a ref, which would resurface as an unexplained wait for a
  // device that is never going to appear.
  //
  // No `userdevice`: XAPI picks a free slot, and the path is read back from the
  // VBD rather than derived from it — the `userdevice` to `xvd<letter>` mapping
  // is a guest convention, not a guarantee.
  const vbdRef = await xapi.VBD_create({
    mode: 'RW',
    throwVbdPlug: true,
    type: 'Disk',
    unpluggable: true,
    VDI: vdiRef,
    VM: vmRef,
  })
  $defer.onFailure(() => xapi.VBD_destroy(vbdRef))

  const path = await waitForVbdDevice(xapi, vbdRef)
  // read back what XAPI recorded rather than probing the device node: a block
  // device's inode reports no size, and we are the ones who provisioned it
  const size = Number(await xapi.getField('VDI', vdiRef, 'virtual_size'))

  const device = createCacheDevice({ path, size })
  await device.open()
  $defer.onFailure(() => device.close())

  info('cache attached', { device: path, diskPath, id, size })

  return { device, vbdRef, vdiRef }
}
