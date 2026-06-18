import type { FrontXoVbd } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import { type IconName, objectIcon } from '@core/icons'

export function getVdiFormat(format: string | undefined): string {
  return format !== undefined ? format.toUpperCase() : 'VHD'
}

export function getVdiIcon(vbds: FrontXoVbd[]): IconName {
  if (vbds.length === 0 || vbds.every(vbd => !vbd.attached)) {
    return objectIcon('vdi', 'detached')
  }

  if (vbds.every(vbd => vbd.attached)) {
    return objectIcon('vdi', 'attached')
  }

  return objectIcon('vdi', 'warning')
}
