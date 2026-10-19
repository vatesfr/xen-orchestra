import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type {
  FrontXoNetwork,
  useXoNetworkCollection,
} from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import type { FrontXoPbd, useXoPbdCollection } from '@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'
import type { FrontXoPif, useXoPifCollection } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type {
  FrontXoSr,
  useXoSrCollection,
} from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { FrontXoVbd } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import type { FrontXoVdi, useXoVdiCollection } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type { FrontXoVif, useXoVifCollection } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import type { useXoVmVbdsUtils } from '@/modules/vm/composables/xo-vm-vbd-utils.composable.ts'
import { useVmMigrateMappingForm } from '@/modules/vm/form/migrate/use-vm-migrate-mapping-form.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createNetwork } from '@/test/create-network.ts'
import { createPbd } from '@/test/create-pbd.ts'
import { createPif } from '@/test/create-pif.ts'
import { createSr } from '@/test/create-sr.ts'
import { createVbd } from '@/test/create-vbd.ts'
import { createVdi } from '@/test/create-vdi.ts'
import { createVif } from '@/test/create-vif.ts'
import { createVm } from '@/test/create-vm.ts'
import { groupBy } from '@/test/group-by.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { VM_POWER_STATE } from '@vates/types'
import { computed, type MaybeRefOrGetter, nextTick, ref, toValue } from 'vue'

const {
  useXoVmVbdsUtilsMock,
  useXoVdiCollectionMock,
  useXoSrCollectionMock,
  useXoPbdCollectionMock,
  useXoVifCollectionMock,
  useXoNetworkCollectionMock,
  useXoPifCollectionMock,
} = vi.hoisted(() => ({
  useXoVmVbdsUtilsMock: vi.fn(),
  useXoVdiCollectionMock: vi.fn(),
  useXoSrCollectionMock: vi.fn(),
  useXoPbdCollectionMock: vi.fn(),
  useXoVifCollectionMock: vi.fn(),
  useXoNetworkCollectionMock: vi.fn(),
  useXoPifCollectionMock: vi.fn(),
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
const PIF_A2_GUEST = 'pif-a2-guest' as FrontXoPif['id']
const PIF_B_PROD = 'pif-b-prod' as FrontXoPif['id']
const PIF_B_MGMT = 'pif-b-mgmt' as FrontXoPif['id']
const PIF_B_OTHER_HOST = 'pif-b-other-host' as FrontXoPif['id']
const PIF_B_GUEST_VLAN = 'pif-b-guest-vlan' as FrontXoPif['id']

const srs = [
  createSr({ id: SR_SHARED, name_label: 'Shared', $pool: POOL_A, shared: true }),
  createSr({ id: SR_LOCAL_A1, name_label: 'Local A1', $pool: POOL_A, shared: false }),
  createSr({ id: SR_B, name_label: 'SR B', $pool: POOL_B, shared: true }),
  createSr({ id: SR_ISO_B, name_label: 'ISO B', $pool: POOL_B, shared: true, content_type: 'iso' }),
]

const pbds = [
  createPbd({ id: 'pbd-1' as FrontXoPbd['id'], SR: SR_SHARED, host: HOST_A1, $pool: POOL_A }),
  createPbd({ id: 'pbd-2' as FrontXoPbd['id'], SR: SR_SHARED, host: HOST_A2, $pool: POOL_A }),
  createPbd({ id: 'pbd-3' as FrontXoPbd['id'], SR: SR_LOCAL_A1, host: HOST_A1, $pool: POOL_A }),
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
  createNetwork({ id: NET_A_GUEST, name_label: 'Guest', $pool: POOL_A, PIFs: [PIF_A2_GUEST, PIF_A_GUEST] }),
  createNetwork({ id: NET_B_PROD, name_label: 'Prod', $pool: POOL_B, PIFs: [PIF_B_PROD] }),
  createNetwork({ id: NET_B_MGMT, name_label: 'Management', $pool: POOL_B, PIFs: [PIF_B_MGMT] }),
  createNetwork({ id: NET_B_NO_PIF, name_label: 'No PIF', $pool: POOL_B, PIFs: [] }),
  createNetwork({ id: NET_B_OTHER_HOST, name_label: 'Other host', $pool: POOL_B, PIFs: [PIF_B_OTHER_HOST] }),
  createNetwork({ id: NET_B_GUEST_VLAN, name_label: 'Guest VLAN', $pool: POOL_B, PIFs: [PIF_B_GUEST_VLAN] }),
]

const vifs = [
  createVif({ id: VIF_PROD, $network: NET_A_PROD, $pool: POOL_A }),
  createVif({ id: VIF_GUEST, $network: NET_A_GUEST, $pool: POOL_A }),
]

const pifs = [
  createPif({ id: PIF_A2_GUEST, $host: HOST_A2, $pool: POOL_A, $network: NET_A_GUEST, device: 'eth5' }),
  createPif({ id: PIF_A_GUEST, $host: HOST_A1, $pool: POOL_A, $network: NET_A_GUEST, device: 'eth1' }),
  createPif({ id: PIF_B_PROD, $host: HOST_B1, $pool: POOL_B, $network: NET_B_PROD }),
  createPif({ id: PIF_B_MGMT, $host: HOST_B1, $pool: POOL_B, $network: NET_B_MGMT }),
  createPif({ id: PIF_B_GUEST_VLAN, $host: HOST_B1, $pool: POOL_B, $network: NET_B_GUEST_VLAN, vlan: 20 }),
  createPif({ id: PIF_B_OTHER_HOST, $host: HOST_B2, $pool: POOL_B, $network: NET_B_OTHER_HOST }),
]

// The collections load lazily, so each source is a ref a test can fill after the form is mounted
const loadedVbds = ref<FrontXoVbd[]>([])
const loadedVdis = ref<FrontXoVdi[]>([])
const loadedPbds = ref<FrontXoPbd[]>([])
const loadedVifs = ref<FrontXoVif[]>([])
const loadedPifs = ref<FrontXoPif[]>([])

beforeEach(() => {
  useXoVmVbdsUtilsMock.mockReset()
  useXoVdiCollectionMock.mockReset()
  useXoSrCollectionMock.mockReset()
  useXoPbdCollectionMock.mockReset()
  useXoVifCollectionMock.mockReset()
  useXoNetworkCollectionMock.mockReset()
  useXoPifCollectionMock.mockReset()

  loadedVbds.value = vbds
  loadedVdis.value = vdis
  loadedPbds.value = pbds
  loadedVifs.value = vifs
  loadedPifs.value = pifs

  useXoVmVbdsUtilsMock.mockReturnValue({ notCdDriveVbds: computed(() => loadedVbds.value) })

  useXoVdiCollectionMock.mockReturnValue({
    useGetVdisByIds: (ids: MaybeRefOrGetter<FrontXoVdi['id'][]>) =>
      computed(() => loadedVdis.value.filter(vdi => toValue(ids).includes(vdi.id))),
  })

  useXoSrCollectionMock.mockReturnValue({
    srs: computed(() => srs),
    getSrById: (id: FrontXoSr['id'] | undefined) => srs.find(sr => sr.id === id),
  })

  useXoPbdCollectionMock.mockReturnValue({
    pbdsBySr: computed(() => groupBy(loadedPbds.value, pbd => pbd.SR)),
  })

  useXoVifCollectionMock.mockReturnValue({
    useGetVifsByIds: (ids: MaybeRefOrGetter<FrontXoVif['id'][]>) =>
      computed(() => loadedVifs.value.filter(vif => toValue(ids).includes(vif.id))),
  })

  useXoNetworkCollectionMock.mockReturnValue({
    networks: computed(() => networks),
    getNetworkById: (id: FrontXoNetwork['id'] | undefined) => networks.find(network => network.id === id),
  })

  useXoPifCollectionMock.mockReturnValue({
    pifsByHost: computed(() => groupBy(loadedPifs.value, pif => pif.$host)),
    getPifsByIds: (ids: FrontXoPif['id'][]) => loadedPifs.value.filter(pif => ids.includes(pif.id)),
  })
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

  it('pre-selects no destination SR', () => {
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
    loadedVbds.value = [sharedVbd]

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

    form.setTargetSrId(VDI_SHARED, SR_LOCAL_A1)

    expect(form.buildPayload()).toEqual({ srIdByVdiId: { [VDI_SHARED]: SR_LOCAL_A1 } })
  })

  it('lets a pre-filled disk be cleared', () => {
    const { form } = mountMappingForm(POOL_A, HOST_A1)

    form.setTargetSrId(VDI_SHARED, undefined)

    expect(form.vdiRows.map(row => row.targetSrId)).toEqual([undefined, SR_LOCAL_A1])
  })

  it('does not require a disk migration for a running VM', () => {
    const { form } = mountMappingForm(POOL_A, HOST_A1)

    expect(form.isDiskMigrationRequired).toBe(false)
    expect(form.isMissingDiskMigration).toBe(false)
    expect(form.isValid).toBe(true)
  })

  it('is invalid for a halted VM while no disk changes SR', () => {
    const vm = createVm({ $pool: POOL_A, $container: POOL_A, power_state: VM_POWER_STATE.HALTED })
    const { form } = mountMappingForm(POOL_A, HOST_A1, vm)

    expect(form.isMissingDiskMigration).toBe(true)
    expect(form.hasNothingToMigrate).toBe(false)
    expect(form.isValid).toBe(false)
    expect(form.buildPayload()).toBeUndefined()
  })

  it('has nothing to migrate for a halted VM without disk', () => {
    const vm = createVm({ $pool: POOL_A, $container: POOL_A, power_state: VM_POWER_STATE.HALTED })
    loadedVbds.value = []

    const { form } = mountMappingForm(POOL_A, HOST_A1, vm)

    expect(form.hasNothingToMigrate).toBe(true)
    expect(form.isValid).toBe(false)
    expect(form.buildPayload()).toBeUndefined()
  })

  it('is invalid for a suspended VM while no disk changes SR', () => {
    const vm = createVm({ $pool: POOL_A, $container: HOST_A1, power_state: VM_POWER_STATE.SUSPENDED })
    const { form } = mountMappingForm(POOL_A, HOST_A1, vm)

    expect(form.isMissingDiskMigration).toBe(true)
    expect(form.isValid).toBe(false)
    expect(form.buildPayload()).toBeUndefined()
  })

  it('is valid for a halted VM once a disk changes SR', () => {
    const vm = createVm({ $pool: POOL_A, $container: POOL_A, power_state: VM_POWER_STATE.HALTED })
    const { form } = mountMappingForm(POOL_A, HOST_A1, vm)

    form.setTargetSrId(VDI_SHARED, SR_LOCAL_A1)

    expect(form.isDiskMigrationRequired).toBe(true)
    expect(form.isMissingDiskMigration).toBe(false)
    expect(form.buildPayload()).toEqual({ srIdByVdiId: { [VDI_SHARED]: SR_LOCAL_A1 } })
  })
})

describe('inter-pool migration', () => {
  it('does not require a disk migration for a halted VM', () => {
    const vm = createVm({ $pool: POOL_A, $container: POOL_A, power_state: VM_POWER_STATE.HALTED })
    const { form } = mountMappingForm(POOL_B, HOST_B1, vm)

    expect(form.isDiskMigrationRequired).toBe(false)
    expect(form.isMissingDiskMigration).toBe(false)
  })

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

  it('reads the source device from the PIF of the VM host', () => {
    const { form } = mountMappingForm(POOL_B, HOST_B1)

    expect(form.vifRows.map(row => row.sourcePif?.id)).toEqual([undefined, PIF_A_GUEST])
  })

  it('falls back to any PIF of the source network when the VM runs on no host', () => {
    const vm = createVm({ $pool: POOL_A, $container: POOL_A, VIFs: [VIF_PROD, VIF_GUEST] })
    const { form } = mountMappingForm(POOL_B, HOST_B1, vm)

    expect(form.vifRows.map(row => row.sourcePif?.id)).toEqual([undefined, PIF_A2_GUEST])
  })

  it('offers only the networks of the target pool that have a PIF on the target host', () => {
    const { form } = mountMappingForm(POOL_B, HOST_B1)

    expect(form.availableNetworks.map(network => network.id)).toEqual([NET_B_PROD, NET_B_MGMT, NET_B_GUEST_VLAN])
  })

  it('fills only the empty rows with the destination network', () => {
    const { form } = mountMappingForm(POOL_B, HOST_B1)

    form.destinationNetworkId = NET_B_MGMT
    form.fillEmptyNetworks()

    expect(form.vifRows.map(row => row.targetNetworkId)).toEqual([NET_B_PROD, NET_B_MGMT])
  })

  it('pre-fills a network sharing a VLAN with the source network when no name matches', () => {
    loadedPifs.value = pifs.map(pif => (pif.id === PIF_A_GUEST ? { ...pif, vlan: 20 } : pif))

    const { form } = mountMappingForm(POOL_B, HOST_B1)

    expect(form.vifRows.map(row => row.targetNetworkId)).toEqual([NET_B_PROD, NET_B_GUEST_VLAN])
  })

  it('resets every target network to its pre-filled value', () => {
    const { form } = mountMappingForm(POOL_B, HOST_B1)

    form.destinationNetworkId = NET_B_MGMT
    form.fillEmptyNetworks()
    form.setTargetNetworkId(VIF_PROD, NET_B_MGMT)
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

    expect(form.destinationSrId).toBeUndefined()
    expect(form.vdiRows.map(row => [row.requiresSr, row.targetSrId])).toEqual([
      [true, undefined],
      [true, undefined],
    ])
    expect(form.vifRows).toHaveLength(2)
  })
})

describe('collections loaded after the target host is chosen', () => {
  it('builds the VDI rows once the VDIs arrive', async () => {
    loadedVdis.value = []

    const { form } = mountMappingForm(POOL_A, HOST_A2)

    expect(form.vdiRows).toEqual([])

    loadedVdis.value = vdis
    await nextTick()

    expect(form.vdiRows.map(row => [row.vdi.id, row.targetSrId])).toEqual([
      [VDI_SHARED, SR_SHARED],
      [VDI_LOCAL, undefined],
    ])
  })

  it('builds the VIF rows once the VIFs arrive', async () => {
    loadedVifs.value = []

    const { form } = mountMappingForm(POOL_B, HOST_B1)

    expect(form.vifRows).toEqual([])
    expect(form.hasMissingNetwork).toBe(false)

    loadedVifs.value = vifs
    await nextTick()

    expect(form.vifRows.map(row => [row.vif.id, row.targetNetworkId])).toEqual([
      [VIF_PROD, NET_B_PROD],
      [VIF_GUEST, undefined],
    ])
    expect(form.hasMissingNetwork).toBe(true)
  })

  it('unflags a shared disk once the PBDs arrive', async () => {
    loadedPbds.value = []

    const { form } = mountMappingForm(POOL_A, HOST_A2)

    expect(form.vdiRows.map(row => [row.requiresSr, row.targetSrId])).toEqual([
      [true, undefined],
      [true, undefined],
    ])

    loadedPbds.value = pbds
    await nextTick()

    expect(form.vdiRows.map(row => [row.requiresSr, row.targetSrId])).toEqual([
      [false, SR_SHARED],
      [true, undefined],
    ])
  })

  it('pre-fills the networks once the PIFs arrive', async () => {
    loadedPifs.value = []

    const { form } = mountMappingForm(POOL_B, HOST_B1)

    expect(form.availableNetworks).toEqual([])
    expect(form.vifRows.map(row => row.targetNetworkId)).toEqual([undefined, undefined])

    loadedPifs.value = pifs
    await nextTick()

    expect(form.vifRows.map(row => row.targetNetworkId)).toEqual([NET_B_PROD, undefined])
  })

  it('keeps the choices already made when the rows are rebuilt', async () => {
    loadedVdis.value = vdis.filter(vdi => vdi.id === VDI_SHARED)

    const { form } = mountMappingForm(POOL_B, HOST_B1)

    form.setTargetSrId(VDI_SHARED, SR_B)

    loadedVdis.value = vdis
    await nextTick()

    expect(form.vdiRows.map(row => row.targetSrId)).toEqual([SR_B, undefined])
  })
})
