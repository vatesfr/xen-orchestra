import type { V2vVmRow, V2vVmStatus } from '@/modules/v2v/types/v2v-vm-row.type.ts'
import { V2V_VM_STATUSES } from '@/modules/v2v/utils/v2v-vm-status.util.ts'
import {
  addFilterClause,
  countFilterPropertyClauses,
  getFilterPropertyClauses,
  isFilterParsable,
  removeFilterProperty,
  setFilterProperty,
} from '@/shared/utils/query-builder-filter.util.ts'
import { objectEntries, objectFromEntries } from '@core/utils/object.util.ts'
import { parse } from 'complex-matcher'
import { sumBy } from 'lodash-es'

export const V2V_VM_PRESETS = ['all', 'not-migrated', 'not-ready', 'in-progress', 'warm', 'cold'] as const

export type V2vVmPresetId = (typeof V2V_VM_PRESETS)[number]

type V2vVmStatusPresetId = Exclude<V2vVmPresetId, 'all'>

type V2vVmMigrationPresetId = Exclude<V2vVmStatusPresetId, 'not-ready'>

const MIGRATION_PROPERTY = 'migration' satisfies keyof V2vVmRow

const SUPPORTED_PROPERTY = 'supported' satisfies keyof V2vVmRow

const STATUS_PROPERTIES = [MIGRATION_PROPERTY, SUPPORTED_PROPERTY]

const MIGRATION_PRESETS: Record<V2vVmStatus, V2vVmMigrationPresetId> = {
  none: 'not-migrated',
  running: 'in-progress',
  warm: 'warm',
  cold: 'cold',
}

// Written as the query builder "is" and "empty" operators write them, so it shows a preset as one of its clauses
const PRESET_CLAUSES: Record<V2vVmStatusPresetId, string> = {
  ...objectFromEntries(
    V2V_VM_STATUSES.map(
      status => [MIGRATION_PRESETS[status], setFilterProperty('', MIGRATION_PROPERTY, status)] as const
    )
  ),
  'not-ready': `!${SUPPORTED_PROPERTY}?`,
}

export function applyV2vPreset(filter: string, presetId: V2vVmPresetId): string {
  const otherClauses = STATUS_PROPERTIES.reduce(
    (remainingFilter, property) => removeFilterProperty(remainingFilter, property),
    filter
  )

  return presetId === 'all' ? otherClauses : addFilterClause(otherClauses, PRESET_CLAUSES[presetId])
}

// A filter no preset writes is a custom one, which no preset stands for: an unparsable filter, a status clause nested
// in a group, several status clauses or one no preset writes
export function getActiveV2vPreset(filter: string): V2vVmPresetId | undefined {
  if (!isFilterParsable(filter)) {
    return undefined
  }

  const statusClauseCount = sumBy(STATUS_PROPERTIES, property => countFilterPropertyClauses(filter, property))

  if (statusClauseCount === 0) {
    return 'all'
  }

  if (statusClauseCount > 1) {
    return undefined
  }

  const [topLevelStatusClause] = STATUS_PROPERTIES.flatMap(property => getFilterPropertyClauses(filter, property))

  return objectEntries(PRESET_CLAUSES).find(([, clause]) => clause === topLevelStatusClause)?.[0]
}

export function countV2vPresets(rows: V2vVmRow[], filter: string): Record<V2vVmPresetId, number> {
  // useQueryBuilderFilter shows every row for an unparsable filter: the counts are those of an empty one
  const facetFilter = isFilterParsable(filter) ? filter : ''

  return objectFromEntries(
    V2V_VM_PRESETS.map(
      presetId =>
        [presetId, rows.filter(parse(applyV2vPreset(facetFilter, presetId)).createPredicate()).length] as const
    )
  )
}
