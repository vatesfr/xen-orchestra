import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type {
  FrontXoNetwork,
  useXoNetworkCollection,
} from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import type { FrontXoPbd, useXoPbdCollection } from '@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'
import type { FrontXoPif, useXoPifCollection } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import type { FrontXoPool, useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type {
  FrontXoSr,
  useXoSrCollection,
} from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { FrontXoVdi, useXoVdiCollection } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type { FrontXoVif, useXoVifCollection } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import type { useXoVmVbdsUtils } from '@/modules/vm/composables/xo-vm-vbd-utils.composable.ts'
import { useVmMigrateMappingForm } from '@/modules/vm/form/migrate/use-vm-migrate-mapping-form.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createPool } from '@/test/create-pool.ts'
import { createSr } from '@/test/create-sr.ts'
import { createVbd } from '@/test/create-vbd.ts'
import { createVdi } from '@/test/create-vdi.ts'
import { createVm } from '@/test/create-vm.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { computed, type MaybeRefOrGetter, nextTick, ref, toValue } from 'vue'

const {
  useXoPoolCollectionMock,
  useXoVmVbdsUtilsMock,
  useXoVdiCollectionMock,
  useXoSrCollectionMock,
  useXoPbdCollectionMock,
  useXoVifCollectionMock,
  useXoNetworkCollectionMock,
  useXoPifCollectionMock,
} = vi.hoisted(() => ({
  useXoPoolCollectionMock: vi.fn(),
  useXoVmVbdsUtilsMock: vi.fn(),
  useXoVdiCollectionMock: vi.fn(),
  useXoSrCollectionMock: vi.fn(),
  useXoPbdCollectionMock: vi.fn(),
  useXoVifCollectionMock: vi.fn(),
  useXoNetworkCollectionMock: vi.fn(),
  useXoPifCollectionMock: vi.fn(),
}))

vi.mock(import('@/modules/pool/remote-resources/use-xo-pool-collection.ts'), () => ({
  useXoPoolCollection: useXoPoolCollectionMock as unknown as typeof useXoPoolCollection,
}))

vi.mock(import('@/modules/vm/composables/xo-vm-vbd-utils.composable.ts'), () => ({
  useXoVmVbdsUtils: useXoVmVbdsUtilsMock as unknown as typeof useXoVmVbdsUtils,
}))

vi.mock(import('@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'), () => ({
  useXoVdiCollection: useXoVdiCollectionMock as unknown as typeof useXoVdiCollection,
}))

vi.mock(import('@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'), () => ({
  useXoSrCollection: useXoSrCollectionMock as unknown as typeof useXoSrCollection,
}))

vi.mock(import('@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'), () => ({
  useXoPbdCollection: useXoPbdCollectionMock as unknown as typeof useXoPbdCollection,
}))

vi.mock(import('@/modules/vif/remote-resources/use-xo-vif-collection.ts'), () => ({
  useXoVifCollection: useXoVifCollectionMock as unknown as typeof useXoVifCollection,
}))

vi.mock(import('@/modules/network/remote-resources/use-xo-network-collection.ts'), () => ({
  useXoNetworkCollection: useXoNetworkCollectionMock as unknown as typeof useXoNetworkCollection,
}))

vi.mock(import('@/modules/pif/remote-resources/use-xo-pif-collection.ts'), () => ({
  useXoPifCollection: useXoPifCollectionMock as unknown as typeof useXoPifCollection,
}))

const POOL_A = 'pool-a' as FrontXoPool['id']
const POOL_B = 'pool-b' as FrontXoPool['id']
const HOST_A1 = 'host-a1' as FrontXoHost['id']
const HOST_A2 = 'host-a2' as FrontXoHost['id']
const HOST_B1 = 'host-b1' as FrontXoHost['id']
const HOST_B2 = 'host-b2' as FrontXoHost['id']
const SR_SHARED = 'sr-shared' as FrontXoSr['id']
const SR_LOCAL_A1 = 'sr-local-a1' as FrontXoSr['id']
const SR_B = 'sr-b' as FrontXoSr['id']
const SR_ISO_B = 'sr-iso-b' as FrontXoSr['id']
const VDI_SHARED = 'vdi-shared' as FrontXoVdi['id']
const VDI_LOCAL = 'vdi-local' as FrontXoVdi['id']
const VIF_PROD = 'vif-prod' as FrontXoVif['id']
const VIF_GUEST = 'vif-guest' as FrontXoVif['id']
const NET_A_PROD = 'net-a-prod' as FrontXoNetwork['id']
const NET_A_GUEST = 'net-a-guest' as FrontXoNetwork['id']
const NET_B_PROD = 'net-b-prod' as FrontXoNetwork['id']
const NET_B_MGMT = 'net-b-mgmt' as FrontXoNetwork['id']
const NET_B_NO_PIF = 'net-b-no-pif' as FrontXoNetwork['id']
const NET_B_OTHER_HOST = 'net-b-other-host' as FrontXoNetwork['id']
const NET_B_GUEST_VLAN = 'net-b-guest-vlan' as FrontXoNetwork['id']
const PIF_A_GUEST = 'pif-a-guest' as FrontXoPif['id']
const PIF_B_PROD = 'pif-b-prod' as FrontXoPif['id']
const PIF_B_MGMT = 'pif-b-mgmt' as FrontXoPif['id']
const PIF_B_OTHER_HOST = 'pif-b-other-host' as FrontXoPif['id']
const PIF_B_GUEST_VLAN = 'pif-b-guest-vlan' as FrontXoPif['id']

function createPbd(overrides: Partial<FrontXoPbd>): FrontXoPbd {
  return {
    id: 'pbd' as FrontXoPbd['id'],
    type: 'PBD',
    attached: true,
    host: HOST_A1,
    SR: SR_SHARED,
    device_config: {},
    otherConfig: {},
    $pool: POOL_A,
    ...overrides,
  }
}

function createVif(overrides: Partial<FrontXoVif>): FrontXoVif {
  return {
    id: 'vif' as FrontXoVif['id'],
    $VM: 'vm-123' as FrontXoVif['$VM'],
    $network: NET_A_PROD,
    attached: true,
    device: '0',
    txChecksumming: true,
    lockingMode: 'network_default',
    MAC: '00:00:00:00:00:00',
    MTU: 1500,
    rateLimit: undefined,
    type: 'VIF',
    other_config: {},
    $pool: POOL_A,
    ...overrides,
  }
}

function createNetwork(overrides: Partial<FrontXoNetwork>): FrontXoNetwork {
  return {
    id: 'net' as FrontXoNetwork['id'],
    name_label: 'Network',
    name_description: '',
    defaultIsLocked: false,
    nbd: false,
    tags: [],
    $pool: POOL_A,
    MTU: 1500,
    PIFs: ['pif' as FrontXoNetwork['PIFs'][number]],
    other_config: {},
    type: 'network',
    isBonded: false,
    ...overrides,
  }
}

const pools = [
  createPool({ id: POOL_A, name_label: 'Pool A', default_SR: SR_SHARED }),
  createPool({ id: POOL_B, name_label: 'Pool B', default_SR: SR_B }),
]

const srs = [
  createSr({ id: SR_SHARED, name_label: 'Shared', $pool: POOL_A, shared: true }),
  createSr({ id: SR_LOCAL_A1, name_label: 'Local A1', $pool: POOL_A, shared: false }),
  createSr({ id: SR_B, name_label: 'SR B', $pool: POOL_B, shared: true }),
  createSr({ id: SR_ISO_B, name_label: 'ISO B', $pool: POOL_B, shared: true, content_type: 'iso' }),
]

const pbds = [
  createPbd({ id: 'pbd-1' as FrontXoPbd['id'], SR: SR_SHARED, host: HOST_A1 }),
  createPbd({ id: 'pbd-2' as FrontXoPbd['id'], SR: SR_SHARED, host: HOST_A2 }),
  createPbd({ id: 'pbd-3' as FrontXoPbd['id'], SR: SR_LOCAL_A1, host: HOST_A1 }),
  createPbd({ id: 'pbd-4' as FrontXoPbd['id'], SR: SR_B, host: HOST_B1, $pool: POOL_B }),
  createPbd({ id: 'pbd-5' as FrontXoPbd['id'], SR: SR_ISO_B, host: HOST_B1, $pool: POOL_B }),
]

const vdis = [
  createVdi({ id: VDI_SHARED, name_label: 'Shared disk', $SR: SR_SHARED, $pool: POOL_A }),
  createVdi({ id: VDI_LOCAL, name_label: 'Local disk', $SR: SR_LOCAL_A1, $pool: POOL_A }),
]

const sharedVbd = createVbd({ id: 'vbd-1' as FrontXoVbd['id'], VDI: VDI_SHARED })
const localVbd = createVbd({ id: 'vbd-2' as FrontXoVbd['id'], VDI: VDI_LOCAL })

const vbds = [sharedVbd, localVbd]

const networks = [
  createNetwork({ id: NET_A_PROD, name_label: 'Prod', $pool: POOL_A }),
  createNetwork({ id: NET_A_GUEST, name_label: 'Guest', $pool: POOL_A }),
  createNetwork({ id: NET_B_PROD, name_label: 'Prod', $pool: POOL_B, PIFs: [PIF_B_PROD] }),
  createNetwork({ id: NET_B_MGMT, name_label: 'Management', $pool: POOL_B, PIFs: [PIF_B_MGMT] }),
  createNetwork({ id: NET_B_NO_PIF, name_label: 'No PIF', $pool: POOL_B, PIFs: [] }),
  createNetwork({ id: NET_B_OTHER_HOST, name_label: 'Other host', $pool: POOL_B, PIFs: [PIF_B_OTHER_HOST] }),
]

const vifs = [createVif({ id: VIF_PROD, $network: NET_A_PROD }), createVif({ id: VIF_GUEST, $network: NET_A_GUEST })]

type FrontXoVbd = ReturnType<typeof createVbd>

function createPif(overrides: Partial<FrontXoPif>): FrontXoPif {
  return {
    id: 'pif' as FrontXoPif['id'],
    $network: NET_B_PROD,
    $host: HOST_B1,
    vlan: -1,
    ...overrides,
  } as FrontXoPif
}

const pifsByHost = new Map<FrontXoHost['id'], FrontXoPif[]>([
  [
    HOST_B1,
    [
      createPif({ id: PIF_B_PROD, $network: NET_B_PROD }),
      createPif({ id: PIF_B_MGMT, $network: NET_B_MGMT }),
      createPif({ id: PIF_B_GUEST_VLAN, $network: NET_B_GUEST_VLAN, vlan: 20 }),
    ],
  ],
  [HOST_B2, [createPif({ id: PIF_B_OTHER_HOST, $network: NET_B_OTHER_HOST, $host: HOST_B2 })]],
])

function mockPoolCollection(availablePools: FrontXoPool[] = pools) {
  useXoPoolCollectionMock.mockReturnValue({
    useGetPoolById: (id: MaybeRefOrGetter<FrontXoPool['id'] | undefined>) =>
      computed(() => availablePools.find(pool => pool.id === toValue(id))),
  })
}

function mockPifCollection(vlanByPifId = new Map<FrontXoPif['id'], number>()) {
  useXoPifCollectionMock.mockReturnValue({
    pifsByHost: computed(() => pifsByHost),
    getPifsByIds: (ids: FrontXoPif['id'][]) => ids.map(id => ({ id, vlan: vlanByPifId.get(id) ?? -1 })),
  })
}

beforeEach(() => {
  useXoPoolCollectionMock.mockReset()
  useXoVmVbdsUtilsMock.mockReset()
  useXoVdiCollectionMock.mockReset()
  useXoSrCollectionMock.mockReset()
  useXoPbdCollectionMock.mockReset()
  useXoVifCollectionMock.mockReset()
  useXoNetworkCollectionMock.mockReset()
  useXoPifCollectionMock.mockReset()

  mockPoolCollection()

  useXoVmVbdsUtilsMock.mockReturnValue({ notCdDriveVbds: computed(() => vbds) })

  useXoVdiCollectionMock.mockReturnValue({
    getVdisByIds: (ids: FrontXoVdi['id'][]) => vdis.filter(vdi => ids.includes(vdi.id)),
  })

  useXoSrCollectionMock.mockReturnValue({
    srs: computed(() => srs),
    getSrById: (id: FrontXoSr['id'] | undefined) => srs.find(sr => sr.id === id),
  })

  useXoPbdCollectionMock.mockReturnValue({
    pbdsBySr: computed(() => {
      const map = new Map<FrontXoSr['id'], FrontXoPbd[]>()

      for (const pbd of pbds) {
        map.set(pbd.SR, [...(map.get(pbd.SR) ?? []), pbd])
      }

      return map
    }),
  })

  useXoVifCollectionMock.mockReturnValue({
    getVifsByIds: (ids: FrontXoVif['id'][]) => vifs.filter(vif => ids.includes(vif.id)),
  })

  useXoNetworkCollectionMock.mockReturnValue({
    networks: computed(() => networks),
    getNetworkById: (id: FrontXoNetwork['id'] | undefined) => networks.find(network => network.id === id),
  })

  mockPifCollection()
})

function mountMappingForm(
  targetPoolId: FrontXoPool['id'] | undefined,
  targetHostId: FrontXoHost['id'] | undefined,
  vm: FrontXoVm = createVm({ $pool: POOL_A, $container: HOST_A1, VIFs: [VIF_PROD, VIF_GUEST] })
) {
  const poolId = ref(targetPoolId)
  const hostId = ref(targetHostId)

  const { wrapper } = mountComposable(() => useVmMigrateMappingForm(vm, poolId, hostId))

  return { form: wrapper.vm, poolId, hostId }
}

type MappingForm = ReturnType<typeof mountMappingForm>['form']

function getVdiRow(form: MappingForm, vdiId: FrontXoVdi['id']) {
  const row = form.vdiRows.find(row => row.vdi.id === vdiId)

  if (row === undefined) {
    throw new Error(`No row found for VDI ${vdiId}`)
  }

  return row
}

function getVifRow(form: MappingForm, vifId: FrontXoVif['id']) {
  const row = form.vifRows.find(row => row.vif.id === vifId)

  if (row === undefined) {
    throw new Error(`No row found for VIF ${vifId}`)
  }

  return row
}

describe('without a target host', () => {
  it('has no rows', () => {
    const { form } = mountMappingForm(POOL_A, undefined)

    expect(form.vdiRows).toEqual([])
    expect(form.vifRows).toEqual([])
  })

  it('does not claim that all SRs are shared', () => {
    const { form } = mountMappingForm(POOL_A, undefined)

    expect(form.areAllSrsShared).toBe(false)
  })
})

describe('intra-pool migration', () => {
  it('flags only the disks whose SR is not connected to the target host', () => {
    const { form } = mountMappingForm(POOL_A, HOST_A2)

    expect(form.vdiRows.map(row => [row.vdi.id, row.requiresSr])).toEqual([
      [VDI_SHARED, false],
      [VDI_LOCAL, true],
    ])
    expect(form.areAllSrsShared).toBe(false)
  })

  it('keeps the source SR on each row', () => {
    const { form } = mountMappingForm(POOL_A, HOST_A2)

    expect(form.vdiRows.map(row => row.sourceSr?.id)).toEqual([SR_SHARED, SR_LOCAL_A1])
  })

  it('does not map VIFs', () => {
    const { form } = mountMappingForm(POOL_A, HOST_A2)

    expect(form.vifRows).toEqual([])
    expect(form.areAllVifsFollowing).toBe(true)
    expect(form.hasMissingNetwork).toBe(false)
  })

  it('offers the writable SRs connected to the target host', () => {
    const { form } = mountMappingForm(POOL_A, HOST_A2)

    expect(form.availableSrs.map(sr => sr.id)).toEqual([SR_SHARED])
  })

  it('is invalid while a flagged disk has no target SR', () => {
    const { form } = mountMappingForm(POOL_A, HOST_A2)

    expect(form.missingSrRows.map(row => row.vdi.id)).toEqual([VDI_LOCAL])
    expect(form.hasMissingSr).toBe(true)
    expect(form.isValid).toBe(false)
    expect(form.buildPayload()).toBeUndefined()
  })

  it('pre-selects the pool default SR as destination SR when a disk needs one', () => {
    const { form } = mountMappingForm(POOL_A, HOST_A2)

    expect(form.destinationSrId).toBe(SR_SHARED)
  })

  it('pre-selects no destination SR when no disk needs one', () => {
    const { form } = mountMappingForm(POOL_A, HOST_A1)

    expect(form.destinationSrId).toBeUndefined()
  })

  it('pre-selects no destination SR when the pool default SR is not connected to the target host', () => {
    mockPoolCollection([createPool({ id: POOL_A, name_label: 'Pool A', default_SR: SR_LOCAL_A1 })])

    const { form } = mountMappingForm(POOL_A, HOST_A2)

    expect(form.destinationSrId).toBeUndefined()
  })

  it('pre-fills the disks whose SR is connected to the target host with their source SR', () => {
    const { form } = mountMappingForm(POOL_A, HOST_A2)

    expect(form.vdiRows.map(row => row.targetSrId)).toEqual([SR_SHARED, undefined])
  })

  it('fills only the empty flagged rows with the destination SR', () => {
    const { form } = mountMappingForm(POOL_A, HOST_A2)

    form.destinationSrId = SR_SHARED
    form.fillEmptySrs()

    expect(form.vdiRows.map(row => row.targetSrId)).toEqual([SR_SHARED, SR_SHARED])
    expect(form.isValid).toBe(true)
  })

  it('resets every target SR to its pre-filled value', () => {
    const { form } = mountMappingForm(POOL_A, HOST_A2)

    form.destinationSrId = SR_SHARED
    form.fillEmptySrs()
    form.resetSrs()

    expect(form.vdiRows.map(row => row.targetSrId)).toEqual([SR_SHARED, undefined])
  })

  it('builds a payload with only the disks that change SR', () => {
    const { form } = mountMappingForm(POOL_A, HOST_A2)

    form.destinationSrId = SR_SHARED
    form.fillEmptySrs()

    expect(form.buildPayload()).toEqual({ srIdByVdiId: { [VDI_LOCAL]: SR_SHARED } })
  })

  it('builds an empty payload when every SR is shared', () => {
    const vm = createVm({ $pool: POOL_A, $container: HOST_A1, VIFs: [] })
    useXoVmVbdsUtilsMock.mockReturnValue({ notCdDriveVbds: computed(() => [sharedVbd]) })

    const { form } = mountMappingForm(POOL_A, HOST_A2, vm)

    expect(form.areAllSrsShared).toBe(true)
    expect(form.isValid).toBe(true)
    expect(form.buildPayload()).toEqual({})
  })

  it('builds an empty payload when every disk stays on its SR', () => {
    const { form } = mountMappingForm(POOL_A, HOST_A1)

    expect(form.vdiRows.map(row => row.targetSrId)).toEqual([SR_SHARED, SR_LOCAL_A1])
    expect(form.buildPayload()).toEqual({})
  })

  it('includes a pre-filled disk once its target SR is changed', () => {
    const { form } = mountMappingForm(POOL_A, HOST_A1)

    getVdiRow(form, VDI_SHARED).targetSrId = SR_LOCAL_A1

    expect(form.buildPayload()).toEqual({ srIdByVdiId: { [VDI_SHARED]: SR_LOCAL_A1 } })
  })
})

describe('inter-pool migration', () => {
  it('flags every disk', () => {
    const { form } = mountMappingForm(POOL_B, HOST_B1)

    expect(form.vdiRows.map(row => row.requiresSr)).toEqual([true, true])
    expect(form.areAllSrsShared).toBe(false)
  })

  it('offers the writable SRs of the target pool connected to the target host', () => {
    const { form } = mountMappingForm(POOL_B, HOST_B1)

    expect(form.availableSrs.map(sr => sr.id)).toEqual([SR_B])
  })

  it('maps every VIF and pre-fills networks with the same name', () => {
    const { form } = mountMappingForm(POOL_B, HOST_B1)

    expect(form.vifRows.map(row => [row.vif.id, row.sourceNetwork?.id, row.targetNetworkId])).toEqual([
      [VIF_PROD, NET_A_PROD, NET_B_PROD],
      [VIF_GUEST, NET_A_GUEST, undefined],
    ])
    expect(form.areAllVifsFollowing).toBe(false)
    expect(form.missingNetworkRows.map(row => row.vif.id)).toEqual([VIF_GUEST])
    expect(form.hasMissingNetwork).toBe(true)
  })

  it('pre-selects the default SR of the target pool as destination SR', () => {
    const { form } = mountMappingForm(POOL_B, HOST_B1)

    expect(form.destinationSrId).toBe(SR_B)
  })

  it('offers only the networks of the target pool that have a PIF on the target host', () => {
    const { form } = mountMappingForm(POOL_B, HOST_B1)

    expect(form.availableNetworks.map(network => network.id)).toEqual([NET_B_PROD, NET_B_MGMT])
  })

  it('fills only the empty rows with the destination network', () => {
    const { form } = mountMappingForm(POOL_B, HOST_B1)

    form.destinationNetworkId = NET_B_MGMT
    form.fillEmptyNetworks()

    expect(form.vifRows.map(row => row.targetNetworkId)).toEqual([NET_B_PROD, NET_B_MGMT])
  })

  it('pre-fills a network sharing a VLAN with the source network when no name matches', () => {
    const networksWithVlan = [
      ...networks.filter(network => network.id !== NET_A_GUEST),
      createNetwork({ id: NET_A_GUEST, name_label: 'Guest', $pool: POOL_A, PIFs: [PIF_A_GUEST] }),
      createNetwork({ id: NET_B_GUEST_VLAN, name_label: 'Guest VLAN', $pool: POOL_B, PIFs: [PIF_B_GUEST_VLAN] }),
    ]
    const vlanByPifId = new Map([
      [PIF_A_GUEST, 20],
      [PIF_B_GUEST_VLAN, 20],
    ])

    useXoNetworkCollectionMock.mockReturnValue({
      networks: computed(() => networksWithVlan),
      getNetworkById: (id: FrontXoNetwork['id'] | undefined) => networksWithVlan.find(network => network.id === id),
    })
    mockPifCollection(vlanByPifId)

    const { form } = mountMappingForm(POOL_B, HOST_B1)

    expect(form.vifRows.map(row => row.targetNetworkId)).toEqual([NET_B_PROD, NET_B_GUEST_VLAN])
  })

  it('resets every target network to its pre-filled value', () => {
    const { form } = mountMappingForm(POOL_B, HOST_B1)

    form.destinationNetworkId = NET_B_MGMT
    form.fillEmptyNetworks()
    getVifRow(form, VIF_PROD).targetNetworkId = NET_B_MGMT
    form.resetNetworks()

    expect(form.vifRows.map(row => row.targetNetworkId)).toEqual([NET_B_PROD, undefined])
  })

  it('builds a payload with every disk and every VIF', () => {
    const { form } = mountMappingForm(POOL_B, HOST_B1)

    form.destinationSrId = SR_B
    form.fillEmptySrs()
    form.destinationNetworkId = NET_B_MGMT
    form.fillEmptyNetworks()

    expect(form.buildPayload()).toEqual({
      srIdByVdiId: { [VDI_SHARED]: SR_B, [VDI_LOCAL]: SR_B },
      networkIdByVifId: { [VIF_PROD]: NET_B_PROD, [VIF_GUEST]: NET_B_MGMT },
    })
  })
})

describe('target change', () => {
  it('rebuilds the rows and resets the choices when the target host changes', async () => {
    const { form, poolId, hostId } = mountMappingForm(POOL_A, HOST_A2)

    form.destinationSrId = SR_SHARED
    form.fillEmptySrs()

    poolId.value = POOL_B
    hostId.value = HOST_B1
    await nextTick()

    expect(form.destinationSrId).toBe(SR_B)
    expect(form.vdiRows.map(row => [row.requiresSr, row.targetSrId])).toEqual([
      [true, undefined],
      [true, undefined],
    ])
    expect(form.vifRows).toHaveLength(2)
  })
})
