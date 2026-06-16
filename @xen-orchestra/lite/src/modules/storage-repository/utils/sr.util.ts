import type { XenApiSr } from '@/libs/xen-api/xen-api.types'
import {
  SR_ACCESS_MODE,
  SR_SCOPE_TYPE,
  type SrAccessMode,
  type SrScope,
} from '@/modules/storage-repository/types/storage-repository.type'

export function getSrAccessMode(srs: XenApiSr[]): SrAccessMode {
  const hasShared = srs.some(sr => sr.shared)
  const hasLocal = srs.some(sr => !sr.shared)

  if (hasShared && hasLocal) {
    return SR_ACCESS_MODE.MIXED
  }

  if (hasShared) {
    return SR_ACCESS_MODE.SHARED
  }

  return SR_ACCESS_MODE.LOCAL
}

export type SrModalInfoVariant = 'host' | 'pool-local' | 'pool-mixed' | 'pool-shared'

export function getSrModalInfoVariant(scope: SrScope, accessMode: SrAccessMode): SrModalInfoVariant {
  if (scope.type === SR_SCOPE_TYPE.HOST) {
    return 'host'
  }

  if (accessMode === SR_ACCESS_MODE.LOCAL) {
    return 'pool-local'
  }

  if (accessMode === SR_ACCESS_MODE.MIXED) {
    return 'pool-mixed'
  }

  return 'pool-shared'
}
