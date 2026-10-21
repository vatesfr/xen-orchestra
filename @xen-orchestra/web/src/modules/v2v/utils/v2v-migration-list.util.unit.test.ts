import {
  buildV2vMigrationList,
  getV2vMigrationListStorageKey,
  parseV2vMigrationList,
} from '@/modules/v2v/utils/v2v-migration-list.util.ts'
import {
  createV2vDestinationDefaults,
  createV2vMigrationList,
  createV2vMigrationListVm,
  createV2vMigrationListVms,
} from '@/test/create-v2v-migration-list.ts'
import {
  V2V_DATA_DISK,
  V2V_DEBIAN_TEMPLATE,
  V2V_DISK_OVERRIDES,
  V2V_NIC_OVERRIDES,
  V2V_VLAN_NETWORK,
  V2V_VLAN_NIC,
} from '@/test/v2v-mapping-fixtures.ts'

const STORED_LIST = createV2vMigrationList({ vms: createV2vMigrationListVms(2) })

const KEY = { sourceId: STORED_LIST.sourceId, poolId: STORED_LIST.poolId }

const OVERRIDDEN_VM = createV2vMigrationListVm({
  disks: V2V_DISK_OVERRIDES,
  nics: V2V_NIC_OVERRIDES,
  template: V2V_DEBIAN_TEMPLATE.id,
  keepMac: false,
  tags: ['migrated-from:vmware', 'web'],
})

function parse(raw: unknown) {
  return parseV2vMigrationList(raw, KEY)
}

describe('getV2vMigrationListStorageKey', () => {
  it('identifies a list by its source and its pool', () => {
    expect(getV2vMigrationListStorageKey(KEY)).toBe(`v2v:migration-list:${KEY.sourceId}:${KEY.poolId}`)
  })
})

describe('buildV2vMigrationList', () => {
  it('creates a list with the defaults and no VM', () => {
    const defaults = createV2vDestinationDefaults()

    expect(buildV2vMigrationList(KEY, defaults)).toEqual({ version: 1, ...KEY, defaults, vms: [] })
  })
})

describe('parseV2vMigrationList', () => {
  it('keeps a valid list', () => {
    expect(parse(STORED_LIST)).toEqual(STORED_LIST)
  })

  it('keeps the overrides of a VM', () => {
    const list = { ...STORED_LIST, vms: [OVERRIDDEN_VM] }

    expect(parse(list)).toEqual(list)
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

  it.each([
    ['disk overrides that are no object', { disks: [] }],
    ['a disk override that is no SR id', { disks: { [V2V_DATA_DISK.key]: 42 } }],
    ['NIC overrides that are no object', { nics: V2V_VLAN_NETWORK.id }],
    ['a NIC override that is no network id', { nics: { [V2V_VLAN_NIC.key]: null } }],
    ['a template override that is no template id', { template: 42 }],
    ['a keep MAC override that is no boolean', { keepMac: 'yes' }],
    ['tags that are no array', { tags: 'web' }],
    ['a tag that is no string', { tags: ['web', 42] }],
  ])('returns no list for a VM with %s', (_, overrides) => {
    expect(parse({ ...STORED_LIST, vms: [{ ...OVERRIDDEN_VM, ...overrides }] })).toBeUndefined()
  })
})
