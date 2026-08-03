import { randomUUID } from 'node:crypto'
import { asyncEach } from '@vates/async-each'
import { createLogger } from '@xen-orchestra/log'
import { Task } from '@vates/task'

import { cacheLabel } from './_utils.mjs'

const { debug, info, warn } = createLogger('xo:mixins:LiveMount')

// Raw "LUN per VDI" driver: the LUN becomes a VDI as-is, with no LVM written to
// it — the only iSCSI SR type usable on a read-only LUN.
const SR_TYPE = 'iscsi'

// identifies the SRs we created, to recognize leftovers
const OC_MOUNT = 'xo:live-mount'

// Our target exposes exactly one LUN, numbered 0.
const LUN_ID = '0'

// see introduceVdi: sm_config is StaticRO, so this module introduces the VDI
// itself rather than letting a scan do it
const IMAGE_FORMAT_RAW = 'raw'

/**
 * Introduce the SR for the LUN on `hostRef` and plug it there.
 *
 * `SR.introduce`, not `SR.create`: create would scan and introduce the VDI
 * itself (see `introduceVdi`), before we get a chance to set `sm_config`.
 */
export async function introduceSr($defer, { xapi, hostRef, deviceConfig, id, nameLabel, diskPath }) {
  return Task.run({ properties: { name: 'introduce SR' } }, async () => {
    const srUuid = randomUUID()
    const srRef = await Task.run({ properties: { name: 'call SR.introduce' } }, () =>
      xapi.call(
        'SR.introduce',
        srUuid,
        nameLabel ?? `[XO live mount] ${id.slice(0, 8)}`,
        `mount of ${diskPath}`,
        SR_TYPE,
        'user',
        false, // not shared: this mount serves a single host
        {}
      )
    )
    $defer.onFailure(() => xapi.call('SR.forget', srRef))

    await Task.run({ properties: { name: 'create and plug PBD' } }, async () => {
      const pbdRef = await xapi.call('PBD.create', { host: hostRef, SR: srRef, device_config: deviceConfig })
      await xapi.call('PBD.plug', pbdRef)
    })
    $defer.onFailure(() => forgetSr(xapi, srRef))

    await xapi.setFieldEntry('SR', srRef, 'other_config', OC_MOUNT, id)
    // disable the auto-scan that would otherwise introduce the VDI itself (see
    // introduceVdi); nothing else writes this key
    await xapi.setFieldEntry('SR', srRef, 'other_config', 'auto-scan', 'false')

    return { srRef, srUuid }
  })
}

// SR.forget rather than SR.destroy: the LUN content must not be touched
export async function forgetSr(xapi, srRef) {
  const pbdRefs = await xapi.call('SR.get_PBDs', srRef)
  await asyncEach(pbdRefs, pbdRef => xapi.call('PBD.unplug', pbdRef), { stopOnError: false })
  await xapi.call('SR.forget', srRef)
}

/**
 * Introduce the LUN as a VDI ourselves — the only way to set `sm_config`,
 * which is StaticRO and can never be amended after introduction.
 *
 * `LUNid` is what the driver needs to find the device; it fills in `SCSIid`
 * and `backend-kind` itself.
 *
 * `readOnly` only states intent: the driver ignores it (and derives its own
 * uuid too, in `_db_introduce()`), so the LUN itself enforces it instead —
 * cached mounts accept writes into the cache, uncached ones throw.
 */
export async function introduceVdi({ xapi, srRef, SCSIid, size, diskPath, readOnly }) {
  return Task.run({ properties: { name: 'introduce VDI' } }, async () => {
    const uuid = randomUUID()
    await Task.run({ properties: { name: 'call VDI.introduce' } }, () =>
      xapi.call(
        'VDI.introduce',
        uuid,
        `${cacheLabel(diskPath)}.raw`,
        `mount of ${diskPath}`,
        srRef,
        'user',
        false, // sharable
        readOnly,
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
    )

    return Task.run({ properties: { name: 'resolve introduced VDI uuid' } }, async () => {
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
    })
  })
}
