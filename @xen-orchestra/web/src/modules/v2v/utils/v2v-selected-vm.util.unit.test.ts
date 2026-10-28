import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { V2vVmRow } from '@/modules/v2v/types/v2v-vm-row.type.ts'
import { getV2vVmMapping } from '@/modules/v2v/utils/v2v-mapping.util.ts'
import {
  getV2vMappingSummary,
  getV2vSelectedVmState,
  isV2vListIssue,
} from '@/modules/v2v/utils/v2v-selected-vm.util.ts'
import { createV2vImportVm } from '@/test/create-v2v-import-vm.ts'
import { createV2vVm } from '@/test/create-v2v-inventory.ts'
import { createV2vDestinationDefaults, createV2vMigrationListVm } from '@/test/create-v2v-migration-list.ts'
import { createV2vVmRow } from '@/test/create-v2v-vm-row.ts'
import {
  V2V_DEFAULT_NETWORK,
  V2V_DEFAULT_SR,
  V2V_DISK_OVERRIDES,
  V2V_MAPPED_VM,
  V2V_POOL_OFFERS,
  V2V_SSD_SR,
} from '@/test/v2v-mapping-fixtures.ts'
import type { XoV2vVm } from '@vates/types'

const LIST_POOL_ID = 'pool-list' as FrontXoPool['id']

const OTHER_POOL_ID = 'pool-other' as FrontXoPool['id']

function findName(objects: { id: string; name_label: string }[], id: string) {
  return objects.find(object => object.id === id)?.name_label
}

const TARGET_NAME_GETTERS = {
  getSrName: (id: string) => findName(V2V_POOL_OFFERS.srs, id),
  getNetworkName: (id: string) => findName(V2V_POOL_OFFERS.networks, id),
}

function createWarmRow(poolId: FrontXoPool['id'], overrides: Partial<V2vVmRow> = {}) {
  return createV2vVmRow({ migration: 'warm', importVm: createV2vImportVm({}, { $pool: poolId }), ...overrides })
}

function createMigratedRow() {
  return createV2vVmRow({
    migration: 'cold',
    importVm: createV2vImportVm({ isWarm: false }, { $pool: LIST_POOL_ID }),
  })
}

// The summary reads the targets, whatever the pool offers
function createMapping(vm: XoV2vVm) {
  const listVm = createV2vMigrationListVm({ disks: V2V_DISK_OVERRIDES })

  return getV2vVmMapping(vm, listVm, createV2vDestinationDefaults(), { srs: [], networks: [], templates: [] })
}

describe('getV2vSelectedVmState', () => {
  const READY = { type: 'ready', level: 'ready' }

  it('resumes a VM warm synced on the pool of the list, ready', () => {
    expect(getV2vSelectedVmState(createWarmRow(LIST_POOL_ID), LIST_POOL_ID)).toEqual({ kind: 'resume', check: READY })
  })

  it('imports a supported VM not migrated as new, ready', () => {
    expect(getV2vSelectedVmState(createV2vVmRow(), LIST_POOL_ID)).toEqual({ kind: 'new', check: READY })
  })

  it('imports a VM warm without its import VM as new, ready', () => {
    expect(getV2vSelectedVmState(createV2vVmRow({ migration: 'warm' }), LIST_POOL_ID)).toEqual({
      kind: 'new',
      check: READY,
    })
  })

  it('imports a VM warm synced on another pool as new, blocked by that pool', () => {
    expect(getV2vSelectedVmState(createWarmRow(OTHER_POOL_ID), LIST_POOL_ID)).toEqual({
      kind: 'new',
      check: { type: 'partial-on-other-pool', level: 'blocking', poolId: OTHER_POOL_ID },
    })
  })

  it('imports a VM warm synced as new, ready, while there is no pool to compare it with', () => {
    expect(getV2vSelectedVmState(createWarmRow(OTHER_POOL_ID), undefined)).toEqual({ kind: 'new', check: READY })
  })

  it('imports a migrated VM as new, with a warning', () => {
    expect(getV2vSelectedVmState(createMigratedRow(), LIST_POOL_ID)).toEqual({
      kind: 'new',
      check: { type: 'already-migrated', level: 'warning' },
    })
  })

  it('blocks a VM missing from the inventory, imported as new', () => {
    expect(getV2vSelectedVmState(undefined, LIST_POOL_ID)).toEqual({
      kind: 'new',
      check: { type: 'not-found', level: 'blocking' },
    })
  })

  it('blocks an unsupported VM, with its reason', () => {
    const row = createV2vVmRow({ supported: false, unsupportedReason: 'encrypted' })

    expect(getV2vSelectedVmState(row, LIST_POOL_ID).check).toEqual({
      type: 'unsupported',
      level: 'blocking',
      reason: 'encrypted',
    })
  })

  it('blocks a VM being imported', () => {
    expect(getV2vSelectedVmState(createV2vVmRow({ migration: 'running' }), LIST_POOL_ID).check).toEqual({
      type: 'running',
      level: 'blocking',
    })
  })

  it('tells an unsupported VM unsupported whatever its migration, still resumed on the pool of the list', () => {
    const row = createWarmRow(LIST_POOL_ID, { supported: false, unsupportedReason: 'rdm' })

    expect(getV2vSelectedVmState(row, LIST_POOL_ID)).toEqual({
      kind: 'resume',
      check: { type: 'unsupported', level: 'blocking', reason: 'rdm' },
    })
  })

  it('tells a VM being imported on another pool running', () => {
    const row = createWarmRow(OTHER_POOL_ID, { migration: 'running' })

    expect(getV2vSelectedVmState(row, LIST_POOL_ID).check.type).toBe('running')
  })

  it('blocks a new VM whose mapping is incomplete', () => {
    expect(getV2vSelectedVmState(createV2vVmRow(), LIST_POOL_ID, 'incomplete')).toEqual({
      kind: 'new',
      check: { type: 'mapping-incomplete', level: 'blocking' },
    })
  })

  it('tells a new VM whose mapping is complete ready', () => {
    expect(getV2vSelectedVmState(createV2vVmRow(), LIST_POOL_ID, 'complete')).toEqual({ kind: 'new', check: READY })
  })

  it('ignores the mapping state of a resumed VM, locked since its first sync', () => {
    expect(getV2vSelectedVmState(createWarmRow(LIST_POOL_ID), LIST_POOL_ID, 'incomplete')).toEqual({
      kind: 'resume',
      check: READY,
    })
  })

  it.each([
    ['unsupported', createV2vVmRow({ supported: false, unsupportedReason: 'rdm' }), 'unsupported'],
    ['being imported', createV2vVmRow({ migration: 'running' }), 'running'],
    ['partially imported on another pool', createWarmRow(OTHER_POOL_ID), 'partial-on-other-pool'],
  ])('blocks a VM %s for that before its incomplete mapping', (_, row, checkType) => {
    expect(getV2vSelectedVmState(row, LIST_POOL_ID, 'incomplete').check.type).toBe(checkType)
  })

  it('blocks a migrated VM for its incomplete mapping before warning about the migration', () => {
    expect(getV2vSelectedVmState(createMigratedRow(), LIST_POOL_ID, 'incomplete').check.type).toBe('mapping-incomplete')
  })
})

describe('getV2vMappingSummary', () => {
  it('maps a new VM to the distinct targets of its disks and NICs', () => {
    expect(getV2vMappingSummary(createMapping(V2V_MAPPED_VM), 'new', TARGET_NAME_GETTERS)).toEqual({
      type: 'mapped',
      diskCount: 2,
      srNames: [V2V_DEFAULT_SR.name_label, V2V_SSD_SR.name_label],
      nicCount: 2,
      networkNames: [V2V_DEFAULT_NETWORK.name_label],
    })
  })

  it('names no target of a kind while one of them is unknown', () => {
    const getters = { ...TARGET_NAME_GETTERS, getSrName: (id: string) => findName([V2V_DEFAULT_SR], id) }

    expect(getV2vMappingSummary(createMapping(V2V_MAPPED_VM), 'new', getters)).toMatchObject({
      srNames: undefined,
      networkNames: [V2V_DEFAULT_NETWORK.name_label],
    })
  })

  it('names once two targets of the same name', () => {
    const getters = { ...TARGET_NAME_GETTERS, getSrName: () => V2V_DEFAULT_SR.name_label }

    expect(getV2vMappingSummary(createMapping(V2V_MAPPED_VM), 'new', getters)).toMatchObject({
      srNames: [V2V_DEFAULT_SR.name_label],
    })
  })

  it('counts a VM without disk nor NIC', () => {
    expect(
      getV2vMappingSummary(createMapping(createV2vVm({ disks: [], nics: [] })), 'new', TARGET_NAME_GETTERS)
    ).toEqual({ type: 'mapped', diskCount: 0, srNames: [], nicCount: 0, networkNames: [] })
  })

  it('locks the mapping of a resumed VM', () => {
    expect(getV2vMappingSummary(createMapping(V2V_MAPPED_VM), 'resume', TARGET_NAME_GETTERS)).toEqual({
      type: 'locked',
    })
  })

  it('summarizes nothing for a VM missing from the inventory', () => {
    expect(getV2vMappingSummary(undefined, 'new', TARGET_NAME_GETTERS)).toBeUndefined()
  })
})

describe('isV2vListIssue', () => {
  it.each([
    ['running', { type: 'running', level: 'blocking' }],
    ['partially imported on another pool', { type: 'partial-on-other-pool', level: 'blocking', poolId: OTHER_POOL_ID }],
    ['with an incomplete mapping', { type: 'mapping-incomplete', level: 'blocking' }],
    ['already migrated', { type: 'already-migrated', level: 'warning' }],
    ['not found in the source', { type: 'not-found', level: 'blocking' }],
  ] as const)('tells the issue of a VM %s', (_, check) => {
    expect(isV2vListIssue(check)).toBe(true)
  })

  it.each([
    ['ready', { type: 'ready', level: 'ready' }],
    ['unsupported, which its source checks tell', { type: 'unsupported', level: 'blocking', reason: 'rdm' }],
  ] as const)('tells no issue of a VM %s', (_, check) => {
    expect(isV2vListIssue(check)).toBe(false)
  })
})
