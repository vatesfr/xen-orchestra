import type { FrontXoHost, useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type {
  FrontXoNetwork,
  useXoNetworkCollection,
} from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import type { FrontXoPif, useXoPifCollection } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import type { FrontXoPool, useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useVmMigrateForm } from '@/modules/vm/form/migrate/use-vm-migrate-form.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createHost } from '@/test/create-host.ts'
import { createNetwork } from '@/test/create-network.ts'
import { createPif } from '@/test/create-pif.ts'
import { createPool } from '@/test/create-pool.ts'
import { createVm } from '@/test/create-vm.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { groupBy } from '@/test/group-by.ts'
import type { FormSelect, FormSelectId } from '@core/packages/form-select'
import { mount } from '@vue/test-utils'
import { computed, defineComponent, h, inject, nextTick, ref, toValue, type MaybeRefOrGetter } from 'vue'

const { useXoPoolCollectionMock, useXoHostCollectionMock, useXoNetworkCollectionMock, useXoPifCollectionMock } =
  vi.hoisted(() => ({
    useXoPoolCollectionMock: vi.fn(),
    useXoHostCollectionMock: vi.fn(),
    useXoNetworkCollectionMock: vi.fn(),
    useXoPifCollectionMock: vi.fn(),
  }))

vi.mock(import('@/modules/pool/remote-resources/use-xo-pool-collection.ts'), () => ({
  useXoPoolCollection: useXoPoolCollectionMock as unknown as typeof useXoPoolCollection,
}))

vi.mock(import('@/modules/host/remote-resources/use-xo-host-collection.ts'), () => ({
  useXoHostCollection: useXoHostCollectionMock as unknown as typeof useXoHostCollection,
}))

vi.mock(import('@/modules/network/remote-resources/use-xo-network-collection.ts'), () => ({
  useXoNetworkCollection: useXoNetworkCollectionMock as unknown as typeof useXoNetworkCollection,
}))

vi.mock(import('@/modules/pif/remote-resources/use-xo-pif-collection.ts'), () => ({
  useXoPifCollection: useXoPifCollectionMock as unknown as typeof useXoPifCollection,
}))

const POOL_ID = 'pool-1' as FrontXoPool['id']
const OTHER_POOL_ID = 'pool-2' as FrontXoPool['id']
const SOURCE_HOST_ID = 'host-src' as FrontXoHost['id']
const TARGET_HOST_ID = 'host-dst' as FrontXoHost['id']
const SECOND_TARGET_HOST_ID = 'host-dst-2' as FrontXoHost['id']
const OTHER_POOL_HOST_ID = 'host-other' as FrontXoHost['id']
const MANAGEMENT_NETWORK_ID = 'net-mgmt' as FrontXoNetwork['id']
const MIGRATION_NETWORK_ID = 'net-migr' as FrontXoNetwork['id']
const NO_IP_NETWORK_ID = 'net-noip' as FrontXoNetwork['id']
const OTHER_POOL_NETWORK_ID = 'net-other' as FrontXoNetwork['id']

const pools = [
  createPool({ id: POOL_ID, name_label: 'nova', otherConfig: { 'xo:migrationNetwork': MIGRATION_NETWORK_ID } }),
  createPool({ id: OTHER_POOL_ID, name_label: 'other', otherConfig: {} }),
]

const hosts = [
  createHost({ id: SOURCE_HOST_ID, name_label: 'source', $pool: POOL_ID }),
  createHost({ id: TARGET_HOST_ID, name_label: 'target', $pool: POOL_ID }),
  createHost({ id: SECOND_TARGET_HOST_ID, name_label: 'second target', $pool: POOL_ID }),
  createHost({ id: OTHER_POOL_HOST_ID, name_label: 'other', $pool: OTHER_POOL_ID }),
]

const networks = [
  createNetwork({
    id: MANAGEMENT_NETWORK_ID,
    name_label: 'Management',
    $pool: POOL_ID,
    PIFs: ['pif-1' as FrontXoPif['id']],
  }),
  createNetwork({
    id: MIGRATION_NETWORK_ID,
    name_label: 'BackupNet',
    $pool: POOL_ID,
    PIFs: ['pif-2' as FrontXoPif['id'], 'pif-5' as FrontXoPif['id']],
  }),
  createNetwork({ id: NO_IP_NETWORK_ID, name_label: 'No IP', $pool: POOL_ID, PIFs: ['pif-3' as FrontXoPif['id']] }),
  createNetwork({ id: 'net-nopif' as FrontXoNetwork['id'], name_label: 'No PIF', $pool: POOL_ID }),
  createNetwork({
    id: OTHER_POOL_NETWORK_ID,
    name_label: 'Other management',
    $pool: OTHER_POOL_ID,
    PIFs: ['pif-4' as FrontXoPif['id']],
  }),
]

const pifs = [
  createPif({
    id: 'pif-1' as FrontXoPif['id'],
    $host: TARGET_HOST_ID,
    $pool: POOL_ID,
    $network: MANAGEMENT_NETWORK_ID,
    ip: '10.1.0.14',
    management: true,
  }),
  createPif({
    id: 'pif-2' as FrontXoPif['id'],
    $host: TARGET_HOST_ID,
    $pool: POOL_ID,
    $network: MIGRATION_NETWORK_ID,
    ip: '172.16.210.14',
  }),
  createPif({ id: 'pif-3' as FrontXoPif['id'], $host: TARGET_HOST_ID, $pool: POOL_ID, $network: NO_IP_NETWORK_ID }),
  createPif({
    id: 'pif-4' as FrontXoPif['id'],
    $host: OTHER_POOL_HOST_ID,
    $pool: OTHER_POOL_ID,
    $network: OTHER_POOL_NETWORK_ID,
    ip: '10.1.9.150',
    management: true,
  }),
  createPif({
    id: 'pif-5' as FrontXoPif['id'],
    $host: SECOND_TARGET_HOST_ID,
    $pool: POOL_ID,
    $network: MIGRATION_NETWORK_ID,
    ip: '172.16.210.15',
  }),
]

const loadedNetworks = ref<FrontXoNetwork[]>([])

beforeEach(() => {
  useXoPoolCollectionMock.mockReset()
  useXoHostCollectionMock.mockReset()
  useXoNetworkCollectionMock.mockReset()
  useXoPifCollectionMock.mockReset()

  useXoPoolCollectionMock.mockReturnValue({
    pools: computed(() => pools),
    useGetPoolById: (id: MaybeRefOrGetter<FrontXoPool['id'] | undefined>) =>
      computed(() => pools.find(pool => pool.id === toValue(id))),
  })

  useXoHostCollectionMock.mockReturnValue({
    hostsByPool: computed(() => groupBy(hosts, host => host.$pool)),
  })

  loadedNetworks.value = networks

  useXoNetworkCollectionMock.mockReturnValue({
    networks: computed(() => loadedNetworks.value),
    getNetworkById: (id: FrontXoNetwork['id'] | undefined) => loadedNetworks.value.find(network => network.id === id),
  })

  useXoPifCollectionMock.mockReturnValue({
    pifsByHost: computed(() => groupBy(pifs, pif => pif.$host)),
    getPifsByIds: (ids: FrontXoPif['id'][]) => pifs.filter(pif => ids.includes(pif.id)),
  })
})

type SelectProbe = { select: FormSelect }

const SelectProbe = defineComponent({
  props: { selectId: { type: Symbol, required: true } },
  setup(props) {
    return { select: inject(props.selectId as FormSelectId) }
  },
  render: () => null,
})

function mountVmMigrateForm(vm: FrontXoVm = createVm({ $pool: POOL_ID, $container: SOURCE_HOST_ID })) {
  let form: ReturnType<typeof useVmMigrateForm> | undefined

  const wrapper = mount(
    defineComponent({
      setup() {
        form = useVmMigrateForm(vm)

        const { hostSelectBindings, migrationNetworkSelectBindings } = form

        return () => [
          h(SelectProbe, { selectId: hostSelectBindings.value.id }),
          h(SelectProbe, { selectId: migrationNetworkSelectBindings.value.id }),
        ]
      },
    }),
    { global: createGlobalTestConfig() }
  )

  const [hostProbe, networkProbe] = wrapper.findAllComponents(SelectProbe)

  if (form === undefined || hostProbe === undefined || networkProbe === undefined) {
    throw new Error('VM migrate form did not mount')
  }

  return {
    form,
    hostSelect: (hostProbe.vm as unknown as SelectProbe).select,
    networkSelect: (networkProbe.vm as unknown as SelectProbe).select,
  }
}

describe('host select', () => {
  it('lists the hosts of the selected pool, current host excluded', () => {
    const { hostSelect } = mountVmMigrateForm()

    expect(hostSelect.allOptions.value.map(option => option.id)).toEqual([TARGET_HOST_ID, SECOND_TARGET_HOST_ID])
  })

  it('resets the host when the pool changes', async () => {
    const { form } = mountVmMigrateForm()

    form.formData.host = TARGET_HOST_ID
    await nextTick()
    form.formData.pool = OTHER_POOL_ID
    await nextTick()

    expect(form.formData.host).toBeUndefined()
  })
})

describe('migration network select', () => {
  it('lists the pool networks with PIFs and selects the pool migration network until a host is selected', () => {
    const { form, networkSelect } = mountVmMigrateForm()

    expect(networkSelect.allOptions.value.map(option => option.id)).toEqual([
      MANAGEMENT_NETWORK_ID,
      MIGRATION_NETWORK_ID,
      NO_IP_NETWORK_ID,
    ])
    expect(form.formData.migrationNetwork).toBe(MIGRATION_NETWORK_ID)
    expect(networkSelect.selectedLabel.value).toBe('BackupNet')
  })

  it('clears the selection when switching to a pool without migration network', async () => {
    const { form, networkSelect } = mountVmMigrateForm()

    form.formData.pool = OTHER_POOL_ID
    await nextTick()

    expect(networkSelect.allOptions.value.map(option => option.id)).toEqual([OTHER_POOL_NETWORK_ID])
    expect(form.formData.migrationNetwork).toBeUndefined()
    expect(networkSelect.selectedLabel.value).toBe('')
  })

  it('lists the networks on which the selected host has a PIF with an IP', async () => {
    const { form, networkSelect } = mountVmMigrateForm()

    form.formData.host = TARGET_HOST_ID
    await nextTick()

    expect(networkSelect.allOptions.value.map(option => option.id)).toEqual([
      MANAGEMENT_NETWORK_ID,
      MIGRATION_NETWORK_ID,
    ])
  })

  it('selects the pool migration network when the host is selected', async () => {
    const { form, networkSelect } = mountVmMigrateForm()

    form.formData.host = TARGET_HOST_ID
    await nextTick()

    expect(form.formData.migrationNetwork).toBe(MIGRATION_NETWORK_ID)
    expect(networkSelect.selectedLabel.value).toBe('BackupNet')
  })

  it('drops a manual choice when the host changes, even if the suggested network is the same', async () => {
    const { form } = mountVmMigrateForm()

    form.formData.host = TARGET_HOST_ID
    await nextTick()
    form.formData.migrationNetwork = MANAGEMENT_NETWORK_ID
    form.formData.host = SECOND_TARGET_HOST_ID
    await nextTick()

    expect(form.formData.migrationNetwork).toBe(MIGRATION_NETWORK_ID)
  })

  it('keeps a manual choice when the suggested network object is replaced by a collection update', async () => {
    const { form } = mountVmMigrateForm()

    form.formData.host = TARGET_HOST_ID
    await nextTick()
    form.formData.migrationNetwork = MANAGEMENT_NETWORK_ID

    loadedNetworks.value = networks.map(network =>
      network.id === MIGRATION_NETWORK_ID ? { ...network, name_label: 'BackupNet renamed' } : network
    )
    await nextTick()

    expect(form.formData.migrationNetwork).toBe(MANAGEMENT_NETWORK_ID)
  })

  it('falls back to the management network for an inter-pool migration', async () => {
    const { form, networkSelect } = mountVmMigrateForm()

    form.formData.pool = OTHER_POOL_ID
    await nextTick()
    form.formData.host = OTHER_POOL_HOST_ID
    await nextTick()

    expect(form.formData.migrationNetwork).toBe(OTHER_POOL_NETWORK_ID)
    expect(networkSelect.selectedLabel.value).toBe('Other management')
  })

  it('shows the pool migration network in the info message as soon as the drawer opens', () => {
    const { form } = mountVmMigrateForm()

    expect(form.migrationNetworkSelectBindings.value.info).toEqual({
      content: 'Your default network is BackupNet',
      accent: 'info',
    })
  })

  it('tells that no default network is configured when the selected pool has no migration network', async () => {
    const { form } = mountVmMigrateForm()

    form.formData.pool = OTHER_POOL_ID
    await nextTick()
    form.formData.host = OTHER_POOL_HOST_ID
    await nextTick()

    expect(form.migrationNetworkSelectBindings.value.info).toEqual({
      content: 'No default network is configured.',
      accent: 'info',
    })
  })
})

describe('validateAndBuildPayload', () => {
  it('builds a payload with the host and the migration network', async () => {
    const { form } = mountVmMigrateForm()

    form.formData.host = TARGET_HOST_ID
    await nextTick()

    await expect(form.validateAndBuildPayload()).resolves.toEqual({
      hostId: TARGET_HOST_ID,
      migrationNetworkId: MIGRATION_NETWORK_ID,
    })
  })

  it('accepts no migration network for an intra-pool migration', async () => {
    const { form } = mountVmMigrateForm()

    form.formData.host = TARGET_HOST_ID
    await nextTick()
    form.formData.migrationNetwork = undefined

    await expect(form.validateAndBuildPayload()).resolves.toEqual({ hostId: TARGET_HOST_ID })
  })

  it('requires a migration network for an inter-pool migration', async () => {
    const { form } = mountVmMigrateForm()

    form.formData.pool = OTHER_POOL_ID
    await nextTick()
    form.formData.host = OTHER_POOL_HOST_ID
    await nextTick()
    form.formData.migrationNetwork = undefined

    await expect(form.validateAndBuildPayload()).resolves.toBeUndefined()
  })

  it('builds no payload without a host', async () => {
    const { form } = mountVmMigrateForm()

    await expect(form.validateAndBuildPayload()).resolves.toBeUndefined()
  })
})
