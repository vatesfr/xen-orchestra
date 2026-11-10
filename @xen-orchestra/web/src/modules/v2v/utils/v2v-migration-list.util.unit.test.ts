import {
  buildV2vMigrationList,
  getV2vMigrationListStorageKey,
  isV2vMigrationListOfNewerVersion,
  parseV2vMigrationList,
} from '@/modules/v2v/utils/v2v-migration-list.util.ts'
import {
  createNewerV2vMigrationList,
  createV2vMigrationList,
  createV2vMigrationListVms,
} from '@/test/create-v2v-migration-list.ts'

const STORED_LIST = createV2vMigrationList({ vms: createV2vMigrationListVms(2) })

const KEY = { sourceId: STORED_LIST.sourceId, poolId: STORED_LIST.poolId }

function parse(raw: unknown) {
  return parseV2vMigrationList(raw, KEY)
}

describe('getV2vMigrationListStorageKey', () => {
  it('identifies a list by its source and its pool', () => {
    expect(getV2vMigrationListStorageKey(KEY)).toBe(`v2v:migration-list:${KEY.sourceId}:${KEY.poolId}`)
  })
})

describe('buildV2vMigrationList', () => {
  it('creates a list with the defaults and the VMs', () => {
    expect(buildV2vMigrationList(KEY, STORED_LIST.defaults, STORED_LIST.vms)).toEqual(STORED_LIST)
  })
})

describe('parseV2vMigrationList', () => {
  it('keeps a valid list', () => {
    expect(parse(STORED_LIST)).toEqual(STORED_LIST)
  })

  it.each([undefined, null, 'a string', 42, []])('returns no list for a value that is no list (%j)', raw => {
    expect(parse(raw)).toBeUndefined()
  })

  it.each([
    ['an unknown version', { version: 2 }],
    ['another source', { sourceId: 'vcenter-uuid-2' }],
    ['another pool', { poolId: 'pool-2' }],
    ['defaults that are no object', { defaults: null }],
    ['defaults missing the template', { defaults: { sr: 'sr-123', network: 'network-123' } }],
    ['VMs that are no array', { vms: {} }],
    ['a VM that is no object', { vms: [null] }],
    ['a VM without id', { vms: [{}] }],
  ])('returns no list for %s', (_, overrides) => {
    expect(parse({ ...STORED_LIST, ...overrides })).toBeUndefined()
  })
})

describe('isV2vMigrationListOfNewerVersion', () => {
  it('is true for a list stored by a newer version', () => {
    expect(isV2vMigrationListOfNewerVersion(createNewerV2vMigrationList())).toBe(true)
  })

  it.each([
    ['a list of this version', STORED_LIST],
    ['a list of an older version', { ...STORED_LIST, version: 0 }],
    ['a version that is no number', { ...STORED_LIST, version: '2' }],
    ['an object without version', {}],
    ['a value that is no object', '{not json'],
    ['no value', undefined],
  ])('is false for %s', (_, raw) => {
    expect(isV2vMigrationListOfNewerVersion(raw)).toBe(false)
  })
})
