import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { V2vVmRow } from '@/modules/v2v/types/v2v-vm-row.type.ts'
import { getV2vMappingSummary, getV2vSelectedVmState } from '@/modules/v2v/utils/v2v-selected-vm.util.ts'
import { createV2vImportVm } from '@/test/create-v2v-import-vm.ts'
import { createV2vDisk, createV2vNic, createV2vVm } from '@/test/create-v2v-inventory.ts'
import { createV2vVmRow } from '@/test/create-v2v-vm-row.ts'

const LIST_POOL_ID = 'pool-list' as FrontXoPool['id']

const OTHER_POOL_ID = 'pool-other' as FrontXoPool['id']

const TARGET_NAMES = { srName: 'sr-nvme-01', networkName: 'VLAN 10' }

function createWarmRow(poolId: FrontXoPool['id'], overrides: Partial<V2vVmRow> = {}) {
  return createV2vVmRow({ migration: 'warm', importVm: createV2vImportVm({}, { $pool: poolId }), ...overrides })
}

function createRowWithDevices(diskCount: number, nicCount: number) {
  return createV2vVmRow({
    vm: createV2vVm({
      disks: Array.from({ length: diskCount }, () => createV2vDisk()),
      nics: Array.from({ length: nicCount }, () => createV2vNic()),
    }),
  })
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
    const row = createV2vVmRow({
      migration: 'cold',
      importVm: createV2vImportVm({ isWarm: false }, { $pool: LIST_POOL_ID }),
    })

    expect(getV2vSelectedVmState(row, LIST_POOL_ID)).toEqual({
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
})

describe('getV2vMappingSummary', () => {
  it('maps the disks and the NICs of a new VM to the defaults of the list', () => {
    expect(getV2vMappingSummary(createRowWithDevices(2, 1), 'new', TARGET_NAMES)).toEqual({
      type: 'defaults',
      diskCount: 2,
      srName: 'sr-nvme-01',
      nicCount: 1,
      networkName: 'VLAN 10',
    })
  })

  it('names no target while the SRs and networks are unknown', () => {
    expect(getV2vMappingSummary(createRowWithDevices(2, 1), 'new', {})).toEqual({
      type: 'defaults',
      diskCount: 2,
      srName: undefined,
      nicCount: 1,
      networkName: undefined,
    })
  })

  it('counts a VM without disk nor NIC', () => {
    expect(getV2vMappingSummary(createRowWithDevices(0, 0), 'new', TARGET_NAMES)).toMatchObject({
      diskCount: 0,
      nicCount: 0,
    })
  })

  it('locks the mapping of a resumed VM', () => {
    expect(getV2vMappingSummary(createWarmRow(LIST_POOL_ID), 'resume', TARGET_NAMES)).toEqual({
      type: 'locked',
    })
  })

  it('summarizes nothing for a VM missing from the inventory', () => {
    expect(getV2vMappingSummary(undefined, 'new', TARGET_NAMES)).toBeUndefined()
  })
})
