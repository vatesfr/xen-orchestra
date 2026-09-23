import type { FrontXoVbd } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type { FrontXoVdiSnapshot } from '@/modules/vdi/remote-resources/use-xo-vdi-snapshot-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { VDI_PAGE_CONTEXT } from '@/shared/constants.ts'
import { type IconName, objectIcon } from '@core/icons'
import { SR_SCOPE_TYPE, type SrScope } from '@core/types/storage-repository.type.ts'
import type { RouteLocationRaw } from 'vue-router'

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

export function isVdiSnapshot(vdi: FrontXoVdi | FrontXoVdiSnapshot): vdi is FrontXoVdiSnapshot {
  return vdi.type === 'VDI-snapshot'
}

function getVdiPageQuery(vdi: FrontXoVdi | FrontXoVdiSnapshot, origin: { vm?: FrontXoVm; srScope?: SrScope }) {
  if (isVdiSnapshot(vdi)) {
    return { from: VDI_PAGE_CONTEXT.VDI_SNAPSHOT }
  }

  if (origin.vm !== undefined) {
    return { from: VDI_PAGE_CONTEXT.VM }
  }

  if (origin.srScope?.type === SR_SCOPE_TYPE.HOST) {
    return { from: VDI_PAGE_CONTEXT.SR, host: origin.srScope.hostId }
  }

  return { from: VDI_PAGE_CONTEXT.SR }
}

export function getVdiPageLocation(
  vdi: FrontXoVdi | FrontXoVdiSnapshot,
  origin: { vm?: FrontXoVm; srScope?: SrScope } = {}
): RouteLocationRaw {
  return {
    name: '/vdi/[id]/general',
    params: { id: vdi.id },
    query: getVdiPageQuery(vdi, origin),
  }
}
