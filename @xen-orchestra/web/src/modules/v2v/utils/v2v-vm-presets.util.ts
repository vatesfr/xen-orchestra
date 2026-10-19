import type { V2vVmRow } from '@/modules/v2v/types/v2v-vm-row.type.ts'
import {
  addFilterClause,
  getFilterPropertyClauses,
  isFilterParsable,
  removeFilterProperty,
} from '@/shared/utils/query-builder-filter.util.ts'
import { parse } from 'complex-matcher'

export const V2V_VM_PRESETS = ['all', 'not-migrated', 'not-ready', 'in-progress', 'warm', 'cold'] as const

export type V2vVmPresetId = (typeof V2V_VM_PRESETS)[number]

// Written as the query builder "is" and "empty" operators write them, so it shows a preset as one of its clauses
const PRESET_CLAUSES: Record<V2vVmPresetId, string | undefined> = {
  all: undefined,
  'not-migrated': 'migration:/^none$/',
  'not-ready': '!supported?',
  'in-progress': 'migration:/^running$/',
  warm: 'migration:/^warm$/',
  cold: 'migration:/^cold$/',
}

function getStatusClauses(filter: string): string[] {
  return [...getFilterPropertyClauses(filter, 'migration'), ...getFilterPropertyClauses(filter, 'supported')]
}

export function applyV2vPreset(filter: string, presetId: V2vVmPresetId): string {
  const otherClauses = removeFilterProperty(removeFilterProperty(filter, 'migration'), 'supported')
  const presetClause = PRESET_CLAUSES[presetId]

  return presetClause === undefined ? otherClauses : addFilterClause(otherClauses, presetClause)
}

export function getActiveV2vPreset(filter: string): V2vVmPresetId | undefined {
  const [statusClause, ...otherStatusClauses] = getStatusClauses(filter)

  if (otherStatusClauses.length > 0) {
    return undefined
  }

  return V2V_VM_PRESETS.find(presetId => PRESET_CLAUSES[presetId] === statusClause)
}

export function countV2vPresets(rows: V2vVmRow[], filter: string): Record<V2vVmPresetId, number> {
  // useQueryBuilderFilter shows every row for an unparsable filter: the counts are those of an empty one
  const facetFilter = isFilterParsable(filter) ? filter : ''

  return Object.fromEntries(
    V2V_VM_PRESETS.map(presetId => [
      presetId,
      rows.filter(parse(applyV2vPreset(facetFilter, presetId)).createPredicate()).length,
    ])
  ) as Record<V2vVmPresetId, number>
}
