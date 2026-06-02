import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { SrAccessMode, SrScope } from '@/modules/storage-repository/types/storage-repository.type'

export function isSrWritable(sr: FrontXoSr) {
  return sr.content_type !== 'iso' && sr.size > 0
}

export function getSrAccessMode(srs: FrontXoSr[]): SrAccessMode {
  const hasShared = srs.some(sr => sr.shared)
  const hasLocal = srs.some(sr => !sr.shared)

  if (hasShared && hasLocal) {
    return 'mixed'
  }

  if (hasShared) {
    return 'shared'
  }

  return 'local'
}

export function getSrModalMessageKeys(params: {
  action: 'connect' | 'disconnect'
  scope: SrScope
  accessMode: SrAccessMode
}): { titleKey: string; infoKey: string } {
  const prefix = params.action === 'connect' ? 'sr-connect' : 'sr-disconnect'
  const titleKey = `${prefix}-title`

  if (params.scope.type === 'host') {
    return {
      titleKey,
      infoKey: `${prefix}-info-host`,
    }
  }

  if (params.accessMode === 'local') {
    return {
      titleKey,
      infoKey: `${prefix}-info-pool-local`,
    }
  }

  if (params.accessMode === 'mixed') {
    return {
      titleKey,
      infoKey: `${prefix}-info-pool-mixed`,
    }
  }

  return {
    titleKey,
    infoKey: `${prefix}-info-pool-shared`,
  }
}
