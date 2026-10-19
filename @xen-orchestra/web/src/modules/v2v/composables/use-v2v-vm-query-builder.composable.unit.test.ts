import { useV2vVmQueryBuilder } from '@/modules/v2v/composables/use-v2v-vm-query-builder.composable.ts'
import type { V2vVmRow } from '@/modules/v2v/types/v2v-vm-row.type.ts'
import { createV2vVmRow } from '@/test/create-v2v-vm-row.ts'
import { createV2vWizardRouter } from '@/test/create-v2v-wizard-router.ts'
import { mountComposableWithI18n } from '@/test/mount-composable.ts'
import type { QueryBuilderSchema } from '@core/packages/query-builder/types.ts'
import { V2V_VM_POWER_STATE } from '@vates/types'
import { flushPromises } from '@vue/test-utils'
import { mapValues } from 'lodash-es'
import { type MaybeRefOrGetter, ref } from 'vue'

const FILTER_QUERY_KEY = 'qb.v2v-vms'

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

async function mountQueryBuilder({
  datastoreNames = ['ds-a', 'ds-b', 'ds-c'],
  filter,
}: { datastoreNames?: MaybeRefOrGetter<string[]>; filter?: string } = {}) {
  const router = await createV2vWizardRouter('vms', { [FILTER_QUERY_KEY]: filter })
  const result = mountComposableWithI18n(() => useV2vVmQueryBuilder(ROWS, datastoreNames), { router })

  return { result, router }
}

function getLabels(entries: Record<string, { label: string }> | undefined) {
  return mapValues(entries, entry => entry.label)
}

function getValueLabels(schema: QueryBuilderSchema, property: string) {
  return getLabels(schema[property].operators.is.values)
}

function getItemNames(items: V2vVmRow[]) {
  return items.map(item => item.name)
}

describe('schema', () => {
  it('exposes the filterable properties with their labels', async () => {
    const { result } = await mountQueryBuilder()

    expect(getLabels(result.schema)).toEqual({
      '': result.t('any-property'),
      name: result.t('name'),
      datastore: result.t('datastores'),
      migration: result.t('migration'),
      power: result.t('power-state'),
      supported: result.t('supported'),
    })
  })

  it('labels each migration status', async () => {
    const { result } = await mountQueryBuilder()

    expect(getValueLabels(result.schema, 'migration')).toEqual({
      none: result.t('not-migrated'),
      running: result.t('in-progress'),
      warm: result.t('v2v:status:warm'),
      cold: result.t('v2v:status:cold'),
    })
  })

  it('labels each power state', async () => {
    const { result } = await mountQueryBuilder()

    expect(getValueLabels(result.schema, 'power')).toEqual({
      [V2V_VM_POWER_STATE.POWERED_ON]: result.t('vm:status:running'),
      [V2V_VM_POWER_STATE.POWERED_OFF]: result.t('vm:status:halted'),
      [V2V_VM_POWER_STATE.SUSPENDED]: result.t('vm:status:suspended'),
    })
  })

  it('labels the supported and unsupported operators', async () => {
    const { result } = await mountQueryBuilder()

    expect(getLabels(result.schema.supported.operators)).toEqual({
      isNotEmpty: result.t('supported'),
      isEmpty: result.t('unsupported'),
    })
  })

  it('offers each datastore name to the "is" and "is not" operators only', async () => {
    const { result } = await mountQueryBuilder({ datastoreNames: ['ds-a', 'ds-b'] })
    const values = { 'ds-a': { label: 'ds-a', value: 'ds-a' }, 'ds-b': { label: 'ds-b', value: 'ds-b' } }

    expect(mapValues(result.schema.datastore.operators, operator => operator.values)).toEqual({
      is: values,
      isNot: values,
      isEmpty: undefined,
      isNotEmpty: undefined,
    })
  })

  it('follows a change of the datastore names', async () => {
    const datastoreNames = ref(['ds-a'])
    const { result } = await mountQueryBuilder({ datastoreNames })

    datastoreNames.value = ['ds-b', 'ds-c']

    expect(getValueLabels(result.schema, 'datastore')).toEqual({ 'ds-b': 'ds-b', 'ds-c': 'ds-c' })
  })

  it('offers no datastore without datastore names', async () => {
    const { result } = await mountQueryBuilder({ datastoreNames: [] })

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
  ])('keeps the rows matching %s', async (filter, names) => {
    const { result } = await mountQueryBuilder()

    result.filter = filter

    expect(getItemNames(result.items)).toEqual(names)
  })

  it('keeps every row without filter', async () => {
    const { result } = await mountQueryBuilder()

    expect(getItemNames(result.items)).toEqual(getItemNames(ROWS))
  })
})

describe('filter', () => {
  it('reads the initial filter from the route', async () => {
    const { result } = await mountQueryBuilder({ filter: 'migration:/^cold$/' })

    expect(result.filter).toBe('migration:/^cold$/')
    expect(getItemNames(result.items)).toEqual([APP_VM.name])
  })

  it('writes the filter to the route', async () => {
    const { result, router } = await mountQueryBuilder()

    result.filter = 'datastore:/^ds-a$/'
    await flushPromises()

    expect(router.currentRoute.value.query[FILTER_QUERY_KEY]).toBe('datastore:/^ds-a$/')
  })
})
