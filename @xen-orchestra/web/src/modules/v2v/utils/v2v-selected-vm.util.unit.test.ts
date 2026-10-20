import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { V2vVmRow } from '@/modules/v2v/types/v2v-vm-row.type.ts'
import {
  countV2vReadiness,
  getV2vMappingSummary,
  getV2vSelectedVmCheck,
  getV2vSelectedVmKind,
} from '@/modules/v2v/utils/v2v-selected-vm.util.ts'
import { createNetwork } from '@/test/create-network.ts'
import { createSr } from '@/test/create-sr.ts'
import { createV2vImportVm } from '@/test/create-v2v-import-vm.ts'
import { createV2vDisk, createV2vNic, createV2vVm } from '@/test/create-v2v-inventory.ts'
import { createV2vDestinationDefaults } from '@/test/create-v2v-migration-list.ts'
import { createV2vVmRow } from '@/test/create-v2v-vm-row.ts'

const LIST_POOL_ID = 'pool-list' as FrontXoPool['id']

const OTHER_POOL_ID = 'pool-other' as FrontXoPool['id']

const DEFAULTS = createV2vDestinationDefaults()

const RESOURCES = {
  srs: [createSr({ id: DEFAULTS.sr, name_label: 'sr-nvme-01' })],
  networks: [createNetwork({ id: DEFAULTS.network, name_label: 'VLAN 10' })],
}

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

describe('getV2vSelectedVmKind', () => {
  it('resumes a VM warm synced on the pool of the list', () => {
    expect(getV2vSelectedVmKind(createWarmRow(LIST_POOL_ID), LIST_POOL_ID)).toBe('resume')
  })

  it.each([
    ['not migrated', createV2vVmRow()],
    ['warm synced on another pool', createWarmRow(OTHER_POOL_ID)],
    ['warm without its import VM', createV2vVmRow({ migration: 'warm' })],
    [
      'migrated',
      createV2vVmRow({ migration: 'cold', importVm: createV2vImportVm({ isWarm: false }, { $pool: LIST_POOL_ID }) }),
    ],
    ['missing from the inventory', undefined],
  ])('imports a VM %s as new', (_, row) => {
    expect(getV2vSelectedVmKind(row, LIST_POOL_ID)).toBe('new')
  })
})

describe('getV2vSelectedVmCheck', () => {
  it('is ready for a supported VM not migrated', () => {
    expect(getV2vSelectedVmCheck(createV2vVmRow(), LIST_POOL_ID)).toEqual({ type: 'ready', level: 'ready' })
  })

  it('is ready for a VM resumed on the pool of the list', () => {
    expect(getV2vSelectedVmCheck(createWarmRow(LIST_POOL_ID), LIST_POOL_ID)).toEqual({ type: 'ready', level: 'ready' })
  })

  it('blocks a VM missing from the inventory', () => {
    expect(getV2vSelectedVmCheck(undefined, LIST_POOL_ID)).toEqual({ type: 'not-found', level: 'blocking' })
  })

  it('blocks an unsupported VM, with its reason', () => {
    const row = createV2vVmRow({ supported: false, unsupportedReason: 'encrypted' })

    expect(getV2vSelectedVmCheck(row, LIST_POOL_ID)).toEqual({
      type: 'unsupported',
      level: 'blocking',
      reason: 'encrypted',
    })
  })

  it('blocks a VM being imported', () => {
    expect(getV2vSelectedVmCheck(createV2vVmRow({ migration: 'running' }), LIST_POOL_ID)).toEqual({
      type: 'running',
      level: 'blocking',
    })
  })

  it('blocks a VM partially imported on another pool, with that pool', () => {
    expect(getV2vSelectedVmCheck(createWarmRow(OTHER_POOL_ID), LIST_POOL_ID)).toEqual({
      type: 'partial-on-other-pool',
      level: 'blocking',
      poolId: OTHER_POOL_ID,
    })
  })

  it('warns about a VM already migrated', () => {
    expect(getV2vSelectedVmCheck(createV2vVmRow({ migration: 'cold' }), LIST_POOL_ID)).toEqual({
      type: 'already-migrated',
      level: 'warning',
    })
  })

  it('tells an unsupported VM unsupported whatever its migration', () => {
    const row = createWarmRow(OTHER_POOL_ID, { migration: 'running', supported: false, unsupportedReason: 'rdm' })

    expect(getV2vSelectedVmCheck(row, LIST_POOL_ID).type).toBe('unsupported')
  })

  it('tells a VM being imported on another pool running', () => {
    expect(getV2vSelectedVmCheck(createWarmRow(OTHER_POOL_ID, { migration: 'running' }), LIST_POOL_ID).type).toBe(
      'running'
    )
  })
})

describe('getV2vMappingSummary', () => {
  it('maps the disks and the NICs of a new VM to the defaults of the list', () => {
    expect(getV2vMappingSummary(createRowWithDevices(2, 1), 'new', DEFAULTS, RESOURCES)).toEqual({
      type: 'defaults',
      diskCount: 2,
      srName: 'sr-nvme-01',
      nicCount: 1,
      networkName: 'VLAN 10',
    })
  })

  it('names no target while the SRs and networks are unknown', () => {
    expect(getV2vMappingSummary(createRowWithDevices(2, 1), 'new', DEFAULTS, { srs: [], networks: [] })).toEqual({
      type: 'defaults',
      diskCount: 2,
      srName: undefined,
      nicCount: 1,
      networkName: undefined,
    })
  })

  it('counts a VM without disk nor NIC', () => {
    expect(getV2vMappingSummary(createRowWithDevices(0, 0), 'new', DEFAULTS, RESOURCES)).toMatchObject({
      diskCount: 0,
      nicCount: 0,
    })
  })

  it('locks the mapping of a resumed VM', () => {
    expect(getV2vMappingSummary(createWarmRow(LIST_POOL_ID), 'resume', DEFAULTS, RESOURCES)).toEqual({
      type: 'locked',
    })
  })

  it('summarizes nothing for a VM missing from the inventory', () => {
    expect(getV2vMappingSummary(undefined, 'new', DEFAULTS, RESOURCES)).toBeUndefined()
  })
})

describe('countV2vReadiness', () => {
  it('counts the VMs of each level', () => {
    expect(countV2vReadiness(['ready', 'blocking', 'ready', 'warning'])).toEqual({ ready: 2, warning: 1, blocking: 1 })
  })

  it('counts nothing without VMs', () => {
    expect(countV2vReadiness([])).toEqual({ ready: 0, warning: 0, blocking: 0 })
  })
})
