import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { SR_SCOPE_TYPE, type SrScope } from '@core/types/storage-repository.type.ts'
import { compareStrings } from '@core/utils/compare-strings.util.ts'
import type { RouteLocationRaw } from 'vue-router'

export function isSrWritable(sr: FrontXoSr) {
  return sr.content_type !== 'iso' && sr.size > 0
}

export function getSrPageLocation(sr: FrontXoSr, scope: SrScope): RouteLocationRaw {
  return {
    name: '/sr/[id]',
    params: { id: sr.id },
    query: { from: scope.type, ...(scope.type === SR_SCOPE_TYPE.HOST && { host: scope.hostId }) },
  }
}

export function getSrCustomFields(sr: FrontXoSr): Record<string, string> {
  const prefix = 'XenCenter.CustomFields.'

  return Object.entries(sr.other_config).reduce<Record<string, string>>((acc, [key, value]) => {
    if (key.startsWith(prefix)) {
      acc[key.slice(prefix.length)] = value
    }

    return acc
  }, {})
}

export function compareSrDescriptions(sr1: FrontXoSr, sr2: FrontXoSr) {
  return compareStrings(sr1.name_description, sr2.name_description)
}

export function compareSrFormats(sr1: FrontXoSr, sr2: FrontXoSr) {
  return compareStrings(sr1.SR_type, sr2.SR_type)
}

export function compareSrAccessModes(sr1: FrontXoSr, sr2: FrontXoSr) {
  return Number(sr1.shared) - Number(sr2.shared)
}

function getSrUsageRatio(sr: FrontXoSr) {
  return sr.size === 0 ? 0 : sr.physical_usage / sr.size
}

export function compareSrUsages(sr1: FrontXoSr, sr2: FrontXoSr) {
  return getSrUsageRatio(sr1) - getSrUsageRatio(sr2)
}
