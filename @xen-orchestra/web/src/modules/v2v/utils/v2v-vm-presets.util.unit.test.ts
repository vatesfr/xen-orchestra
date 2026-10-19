import type { V2vVmRow } from '@/modules/v2v/types/v2v-vm-row.type.ts'
import {
  applyV2vPreset,
  countV2vPresets,
  getActiveV2vPreset,
  V2V_VM_PRESETS,
  type V2vVmPresetId,
} from '@/modules/v2v/utils/v2v-vm-presets.util.ts'
import { createV2vVmRow } from '@/test/create-v2v-vm-row.ts'
import { UNPARSABLE_FILTER } from '@/test/query-builder-filters.ts'
import type { PropertyOperator } from '@core/packages/query-builder/types.ts'
import { useRawFilter } from '@core/packages/query-builder/filter/use-raw-filter.ts'
import { parse } from 'complex-matcher'
import { ref } from 'vue'

const DATASTORE_FILTER = 'datastore:/^ds-a$/'

const NOT_MIGRATED_VM = createV2vVmRow({ name: 'not-migrated', migration: 'none' })

const UNSUPPORTED_VM = createV2vVmRow({ name: 'unsupported', migration: 'none', supported: false })

const RUNNING_VM = createV2vVmRow({ name: 'running', migration: 'running' })

const WARM_VM = createV2vVmRow({ name: 'warm', migration: 'warm' })

const COLD_VM = createV2vVmRow({ name: 'cold', migration: 'cold' })

const STATUS_ROWS = [NOT_MIGRATED_VM, UNSUPPORTED_VM, RUNNING_VM, WARM_VM, COLD_VM]

function filterRows(rows: V2vVmRow[], filter: string) {
  return rows.filter(parse(filter).createPredicate()).map(row => row.name)
}

describe('V2V_VM_PRESETS', () => {
  it('lists the presets in the order of the preset row', () => {
    expect(V2V_VM_PRESETS).toEqual(['all', 'not-migrated', 'not-ready', 'in-progress', 'warm', 'cold'])
  })
})

describe('applyV2vPreset', () => {
  // The query builder must read a preset back as one of its own clauses
  it.each<[V2vVmPresetId, string, PropertyOperator, string]>([
    ['not-migrated', 'migration', 'is', 'none'],
    ['not-ready', 'supported', 'isEmpty', ''],
    ['in-progress', 'migration', 'is', 'running'],
    ['warm', 'migration', 'is', 'warm'],
    ['cold', 'migration', 'is', 'cold'],
  ])('writes the %s clause as the query builder does for %s %s %s', (presetId, property, operator, value) => {
    expect(applyV2vPreset('', presetId)).toBe(useRawFilter(ref(property), ref(operator), ref(value)).value)
  })

  it.each<[V2vVmPresetId, string[]]>([
    ['not-migrated', [NOT_MIGRATED_VM.name, UNSUPPORTED_VM.name]],
    ['not-ready', [UNSUPPORTED_VM.name]],
    ['in-progress', [RUNNING_VM.name]],
    ['warm', [WARM_VM.name]],
    ['cold', [COLD_VM.name]],
  ])('matches only its rows with the %s clause', (presetId, names) => {
    expect(filterRows(STATUS_ROWS, applyV2vPreset('', presetId))).toEqual(names)
  })

  it('keeps an empty filter empty for all', () => {
    expect(applyV2vPreset('', 'all')).toBe('')
  })

  it('keeps the clauses of the other properties', () => {
    expect(applyV2vPreset(`${DATASTORE_FILTER} name:app`, 'warm')).toBe(
      `${DATASTORE_FILTER} name:app migration:/^warm$/`
    )
  })

  it('replaces the clause of the previous preset', () => {
    expect(applyV2vPreset(`migration:/^none$/ ${DATASTORE_FILTER}`, 'not-ready')).toBe(
      `${DATASTORE_FILTER} !supported?`
    )
  })

  it('replaces every migration and supported clause, whatever its form', () => {
    expect(applyV2vPreset('!migration:/^cold$/ supported? migration:/^warm$/ !supported?', 'cold')).toBe(
      'migration:/^cold$/'
    )
  })

  it('removes the migration and supported clauses for all and keeps the others', () => {
    expect(applyV2vPreset(`${DATASTORE_FILTER} migration:/^warm$/ !supported?`, 'all')).toBe(DATASTORE_FILTER)
  })

  it('leaves an unparsable filter unchanged', () => {
    expect(applyV2vPreset(UNPARSABLE_FILTER, 'warm')).toBe(UNPARSABLE_FILTER)
  })
})

describe('getActiveV2vPreset', () => {
  it.each<[V2vVmPresetId, string]>([
    ['all', DATASTORE_FILTER],
    ['not-migrated', `${DATASTORE_FILTER} migration:/^none$/`],
    ['not-ready', `!supported? ${DATASTORE_FILTER}`],
    ['in-progress', `${DATASTORE_FILTER} migration:/^running$/`],
    ['warm', `${DATASTORE_FILTER} migration:/^warm$/`],
    ['cold', `${DATASTORE_FILTER} migration:/^cold$/`],
  ])('is %s for the filter %s', (presetId, filter) => {
    expect(getActiveV2vPreset(filter)).toBe(presetId)
  })

  it('is all for an empty filter', () => {
    expect(getActiveV2vPreset('')).toBe('all')
  })

  // Presets only edit the top-level clauses, as do the counts
  it('is all for a status clause nested in a group', () => {
    expect(getActiveV2vPreset('|(migration:/^warm$/ name:app)')).toBe('all')
  })

  // useQueryBuilderFilter shows every row for an unparsable filter
  it('is all for an unparsable filter', () => {
    expect(getActiveV2vPreset(UNPARSABLE_FILTER)).toBe('all')
  })

  it.each([
    ['two migration values', 'migration:/^warm$/ migration:/^cold$/'],
    ['a migration and a supported clause', 'migration:/^none$/ !supported?'],
    ['a negated migration clause', '!migration:/^none$/'],
    ['a migration clause no preset writes', 'migration:/^warm/'],
    ['the supported clause', 'supported?'],
  ])('is none for %s', (_, filter) => {
    expect(getActiveV2vPreset(filter)).toBeUndefined()
  })
})

describe('countV2vPresets', () => {
  it.each([
    ['an empty filter', ''],
    ['an unparsable filter', UNPARSABLE_FILTER],
  ])('counts the rows of each preset for %s', (_, filter) => {
    expect(countV2vPresets(STATUS_ROWS, filter)).toEqual({
      all: 5,
      'not-migrated': 2,
      'not-ready': 1,
      'in-progress': 1,
      warm: 1,
      cold: 1,
    })
  })

  it('counts within the other clauses and replaces the status one', () => {
    const rows = [
      createV2vVmRow({ datastore: ['ds-a'], migration: 'none' }),
      createV2vVmRow({ datastore: ['ds-b', 'ds-a'], migration: 'warm' }),
      createV2vVmRow({ datastore: ['ds-a'], migration: 'warm', supported: false }),
      createV2vVmRow({ datastore: ['ds-b'], migration: 'warm' }),
    ]

    expect(countV2vPresets(rows, `${DATASTORE_FILTER} migration:/^cold$/`)).toEqual({
      all: 3,
      'not-migrated': 1,
      'not-ready': 1,
      'in-progress': 0,
      warm: 2,
      cold: 0,
    })
  })

  it('counts zero rows of each preset without rows', () => {
    expect(countV2vPresets([], '')).toEqual({
      all: 0,
      'not-migrated': 0,
      'not-ready': 0,
      'in-progress': 0,
      warm: 0,
      cold: 0,
    })
  })
})
