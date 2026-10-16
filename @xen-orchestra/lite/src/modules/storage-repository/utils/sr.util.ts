import type { XenApiSr } from '@/libs/xen-api/xen-api.types.ts'
import { compareStrings } from '@core/utils/compare-strings.util.ts'

export function compareSrFormats(sr1: XenApiSr, sr2: XenApiSr) {
  return compareStrings(sr1.type, sr2.type)
}

export function compareSrAccessModes(sr1: XenApiSr, sr2: XenApiSr) {
  return Number(sr1.shared) - Number(sr2.shared)
}

function getSrUsageRatio(sr: XenApiSr) {
  return sr.physical_size === 0 ? 0 : sr.physical_utilisation / sr.physical_size
}

export function compareSrUsages(sr1: XenApiSr, sr2: XenApiSr) {
  return getSrUsageRatio(sr1) - getSrUsageRatio(sr2)
}
