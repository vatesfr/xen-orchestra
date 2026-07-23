import type { XenApiVmGuestMetrics } from '@/libs/xen-api/xen-api.types.ts'

/**
 * Adapted from `getVmGuestToolsProps` in xo-server (`packages/xo-server/src/xapi-object-to-xo.mjs`),
 * which computes `managementAgentDetected` and `pvDriversDetected` on XO VM objects.
 *
 * The XS < 7 fallback (`PV_drivers_detected ?? hasPvVersion`) is intentionally not reproduced.
 *
 * @see https://github.com/vatesfr/xen-orchestra/blob/master/packages/xo-server/src/xapi-object-to-xo.mjs
 */
export function areVmToolsDetected(guestMetrics: XenApiVmGuestMetrics | undefined): boolean {
  if (guestMetrics === undefined) {
    return false
  }

  const { major, minor } = guestMetrics.PV_drivers_version
  const hasPvVersion = major !== undefined && minor !== undefined

  const pvDriversDetected = guestMetrics.PV_drivers_detected
  const managementAgentDetected = hasPvVersion || guestMetrics.other['feature-static-ip-setting'] === '1'

  return managementAgentDetected && pvDriversDetected
}
