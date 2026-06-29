import type { XenApiVbd, XenApiVdi } from '@/libs/xen-api/xen-api.types.ts'
import { type IconName, objectIcon } from '@core/icons'

export function getVdiIcon(vbds: XenApiVbd[]): IconName {
  if (vbds.length === 0 || vbds.every(vbd => !vbd.currently_attached)) {
    return objectIcon('vdi', 'detached')
  }

  if (vbds.every(vbd => vbd.currently_attached)) {
    return objectIcon('vdi', 'attached')
  }

  return objectIcon('vdi', 'warning')
}

export function getVbdsForVdi(
  vdi: XenApiVdi,
  getVbdByOpaqueRef: (ref: XenApiVbd['$ref']) => XenApiVbd | undefined
): XenApiVbd[] {
  return vdi.VBDs.map(ref => getVbdByOpaqueRef(ref)).filter((vbd): vbd is XenApiVbd => vbd !== undefined)
}
