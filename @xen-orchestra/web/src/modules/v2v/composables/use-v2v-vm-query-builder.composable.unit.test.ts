import { useV2vVmLabels } from '@/modules/v2v/composables/use-v2v-vm-labels.composable.ts'
import { useV2vVmQueryBuilder } from '@/modules/v2v/composables/use-v2v-vm-query-builder.composable.ts'
import { createV2vVmRow, getV2vVmNames } from '@/test/create-v2v-vm-row.ts'
import { mountComposableWithI18n } from '@/test/mount-composable.ts'
import type { QueryBuilderSchema } from '@core/packages/query-builder/types.ts'
import { parseValues } from '@core/packages/query-builder/schema/parse-values.ts'
import { V2V_VM_POWER_STATE } from '@vates/types'
import { mapValues } from 'lodash-es'
import { type MaybeRefOrGetter, ref } from 'vue'

const WEB_VM = createV2vVmRow({
  name: 'web-01',
  migration: 'warm',
  power: V2V_VM_POWER_STATE.POWERED_ON,
  datastore: ['ds-a', 'ds-b'],
})

const DB_VM = createV2vVmRow({
  name: 'db-01',
  migration: 'none',
  power: V2V_VM_POWER_STATE.POWERED_OFF,
  datastore: ['ds-b'],
  supported: false,
})

const APP_VM = createV2vVmRow({
  name: 'app-01',
  migration: 'cold',
  power: V2V_VM_POWER_STATE.SUSPENDED,
  datastore: ['ds-c'],
})

const ROWS = [WEB_VM, DB_VM, APP_VM]

function mountQueryBuilder({
  datastoreNames = ['ds-a', 'ds-b', 'ds-c'],
  initialFilter,
}: { datastoreNames?: MaybeRefOrGetter<string[]>; initialFilter?: string } = {}) {
  return mountComposableWithI18n(() => {
    const { statusLabels, powerLabels } = useV2vVmLabels()

    return {
      ...useV2vVmQueryBuilder('v2v-vms', ROWS, datastoreNames, { initialFilter, ignoreRoute: true }),
      statusLabels,
      powerLabels,
    }
  })
}

function getLabels(entries: Record<string, { label: string }> | undefined) {
  return mapValues(entries, entry => entry.label)
}

function getValueLabels(schema: QueryBuilderSchema, property: string) {
  return getLabels(schema[property].operators.is.values)
}

describe('schema', () => {
  it('exposes the filterable properties with their labels', () => {
    const result = mountQueryBuilder()

    expect(getLabels(result.schema)).toEqual({
      '': result.t('any-property'),
      name: result.t('name'),
      datastore: result.t('datastores'),
      migration: result.t('migration'),
      power: result.t('power-state'),
      supported: result.t('supported'),
    })
  })

  it('labels each migration status', () => {
    const result = mountQueryBuilder()

    expect(getValueLabels(result.schema, 'migration')).toEqual(result.statusLabels)
  })

  it('labels each power state', () => {
    const result = mountQueryBuilder()

    expect(getValueLabels(result.schema, 'power')).toEqual(result.powerLabels)
  })

  it('labels the supported and unsupported operators', () => {
    const result = mountQueryBuilder()

    expect(getLabels(result.schema.supported.operators)).toEqual({
      isNotEmpty: result.t('supported'),
      isEmpty: result.t('unsupported'),
    })
  })

  it('offers each datastore name to the "is" and "is not" operators only', () => {
    const result = mountQueryBuilder({ datastoreNames: ['ds-a', 'ds-b'] })
    const values = parseValues({ 'ds-a': 'ds-a', 'ds-b': 'ds-b' })

    expect(mapValues(result.schema.datastore.operators, operator => operator.values)).toEqual({
      is: values,
      isNot: values,
      isEmpty: undefined,
      isNotEmpty: undefined,
    })
  })

  it('follows a change of the datastore names', () => {
    const datastoreNames = ref(['ds-a'])
    const result = mountQueryBuilder({ datastoreNames })

    datastoreNames.value = ['ds-b', 'ds-c']

    expect(getValueLabels(result.schema, 'datastore')).toEqual({ 'ds-b': 'ds-b', 'ds-c': 'ds-c' })
  })

  it('offers no datastore without datastore names', () => {
    const result = mountQueryBuilder({ datastoreNames: [] })

    expect(result.schema.datastore.operators.is.values).toEqual({})
  })
})

describe('items', () => {
  it.each([
    ['migration:/^warm$/', [WEB_VM.name]],
    ['!supported?', [DB_VM.name]],
    ['power:/^suspended$/', [APP_VM.name]],
    ['name:web', [WEB_VM.name]],
    ['datastore:/^ds-a$/', [WEB_VM.name]],
    ['datastore:/^ds-b$/', [WEB_VM.name, DB_VM.name]],
  ])('keeps the rows matching %s', (filter, names) => {
    const result = mountQueryBuilder()

    result.filter = filter

    expect(getV2vVmNames(result.items)).toEqual(names)
  })

  it('keeps every row without filter', () => {
    const result = mountQueryBuilder()

    expect(getV2vVmNames(result.items)).toEqual(getV2vVmNames(ROWS))
  })
})

describe('filter', () => {
  it('starts from the initial filter', () => {
    const result = mountQueryBuilder({ initialFilter: 'migration:/^cold$/' })

    expect(result.filter).toBe('migration:/^cold$/')
    expect(getV2vVmNames(result.items)).toEqual([APP_VM.name])
  })
})
