import type { FrontXoVbd } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import { type IconName, objectIcon } from '@core/icons'
import { compareStrings } from '@core/utils/compare-strings.util.ts'
import { getUsageRatio } from '@core/utils/usage-ratio.util.ts'

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

export function compareVdiFormats(vdi1: FrontXoVdi, vdi2: FrontXoVdi) {
  return compareStrings(getVdiFormat(vdi1.image_format), getVdiFormat(vdi2.image_format))
}

export function compareVdiUsages(vdi1: FrontXoVdi, vdi2: FrontXoVdi) {
  return getUsageRatio(vdi1.usage, vdi1.size) - getUsageRatio(vdi2.usage, vdi2.size)
}
