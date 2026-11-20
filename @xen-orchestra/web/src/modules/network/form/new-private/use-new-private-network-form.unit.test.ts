import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { useNewPrivateNetworkForm } from '@/modules/network/form/new-private/use-new-private-network-form.ts'
import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import type { FrontXoPif } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { createHost } from '@/test/create-host.ts'
import { createNetwork } from '@/test/create-network.ts'
import { createPool, OTHER_POOL_ID, UNKNOWN_POOL_ID } from '@/test/create-pool.ts'
import { dangerMessage } from '@/test/form-messages.ts'
import { xoCollectionsMock } from '@/test/mock-xo-collections.ts'
import { mountWithSelect } from '@/test/mount-with-select.ts'
import { findSelectOptionLabels, openSelect, pickSelectOption } from '@/test/select.ts'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import { TUNNEL_PROTOCOL } from '@vates/types'
import { flushPromises, type VueWrapper } from '@vue/test-utils'
import { h, nextTick, reactive } from 'vue'
import { useI18n } from 'vue-i18n'

vi.mock(
  import('@/modules/pool/remote-resources/use-xo-pool-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)
vi.mock(
  import('@/modules/host/remote-resources/use-xo-host-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)
vi.mock(
  import('@/modules/network/remote-resources/use-xo-network-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)

const POOL = createPool()

const OTHER_POOL = createPool({
  id: OTHER_POOL_ID,
  name_label: 'Other pool',
  master: 'host-2' as FrontXoPool['master'],
})

const HOST = createHost({ name_label: 'Host of the pool' })

const OTHER_HOST = createHost({
  id: 'host-2' as FrontXoHost['id'],
  name_label: 'Host of the other pool',
  $pool: OTHER_POOL_ID,
})

const PIF_ID = 'pif-1' as FrontXoPif['id']

const OTHER_PIF_ID = 'pif-2' as FrontXoPif['id']

const ENCAPSULATION_LABELS = { [TUNNEL_PROTOCOL.GRE]: 'GRE', [TUNNEL_PROTOCOL.VXLAN]: 'VxLAN' }

beforeEach(() => {
  xoCollectionsMock.reset()
  xoCollectionsMock.pools.value = [POOL, OTHER_POOL]
  xoCollectionsMock.hosts.value = [HOST, OTHER_HOST]
})

function createEncryptedNetwork(poolId: FrontXoPool['id'], encapsulation: TUNNEL_PROTOCOL): FrontXoNetwork {
  return createNetwork({
    $pool: poolId,
    other_config: {
      'xo:sdn-controller:private-network-uuid': `private-network-${encapsulation}`,
      'xo:sdn-controller:encrypted': 'true',
      'xo:sdn-controller:encapsulation': encapsulation,
    },
  })
}

// The encapsulation and the preferred center are only chosen through their select, rendered here
function mountForm(poolId: FrontXoPool['id'] = POOL.id) {
  let form: ReturnType<typeof createForm> | undefined

  function createForm() {
    const { t } = useI18n()

    return reactive({ ...useNewPrivateNetworkForm(poolId), t })
  }

  const wrapper = mountWithSelect(() => {
    form = createForm()

    return () =>
      h('div', [
        h('div', { class: 'encapsulation' }, [
          h(VtsSelect, { id: form!.encapsulationSelectBindings.id, accent: 'brand' }),
        ]),
        h('div', { class: 'preferred-center' }, [
          h(VtsSelect, { id: form!.preferredCenterSelectBindings.id, accent: 'brand' }),
        ]),
      ])
  })

  return { wrapper, form: form! }
}

type Form = ReturnType<typeof mountForm>['form']

async function chooseEncapsulation(wrapper: VueWrapper, encapsulation: TUNNEL_PROTOCOL) {
  await openSelect(wrapper.get('.encapsulation'))
  await pickSelectOption(wrapper, ENCAPSULATION_LABELS[encapsulation])
}

async function choosePreferredCenter(wrapper: VueWrapper, host: FrontXoHost) {
  await openSelect(wrapper.get('.preferred-center'))
  await pickSelectOption(wrapper, host.name_label)
}

async function fillInterface(
  form: Form,
  index: number,
  { pool, pif }: { pool?: FrontXoPool['id']; pif?: FrontXoPif['id'] }
) {
  form.interfaces[index].pool = pool
  form.interfaces[index].pif = pif
  await nextTick()
}

// One interface on each pool
async function fillInterfaces(form: Form) {
  await fillInterface(form, 0, { pool: POOL.id, pif: PIF_ID })
  form.addInterface()
  await fillInterface(form, 1, { pool: OTHER_POOL_ID, pif: OTHER_PIF_ID })
}

async function mountCompleteForm() {
  const mounted = mountForm()
  mounted.form.nameInputBindings['onUpdate:modelValue']('Private network')
  await fillInterfaces(mounted.form)
  await chooseEncapsulation(mounted.wrapper, TUNNEL_PROTOCOL.VXLAN)

  return mounted
}

describe('interfaces', () => {
  it('starts with one interface on the pool of the page', () => {
    const { form } = mountForm()

    expect(form.interfaces).toEqual([{ key: expect.any(String), pool: POOL.id, pif: undefined }])
  })

  it('starts with one interface without pool when the pool of the page is unknown', () => {
    const { form } = mountForm(UNKNOWN_POOL_ID)

    expect(form.interfaces).toEqual([{ key: expect.any(String), pool: undefined, pif: undefined }])
  })
})

describe('addInterface', () => {
  it('adds an interface without pool nor PIF, keyed apart from the others', () => {
    const { form } = mountForm()

    form.addInterface()

    expect(form.interfaces[1]).toEqual({ key: expect.any(String), pool: undefined, pif: undefined })
    expect(form.interfaces[1].key).not.toBe(form.interfaces[0].key)
  })
})

describe('removeInterface', () => {
  it('removes the interface at the given index', async () => {
    const { form } = mountForm()
    await fillInterfaces(form)

    form.removeInterface(1)

    expect(form.interfaces.map(networkInterface => networkInterface.pool)).toEqual([POOL.id])
  })
})

describe('canAddInterface', () => {
  it('is true while there are fewer interfaces than pools', () => {
    expect(mountForm().form.canAddInterface).toBe(true)
  })

  it('is false once there is an interface per pool', () => {
    const { form } = mountForm()

    form.addInterface()

    expect(form.canAddInterface).toBe(false)
  })
})

describe('getExcludedPoolIds', () => {
  it('excludes the pools of the other interfaces, not the pool of the interface itself', async () => {
    const { form } = mountForm()
    await fillInterfaces(form)

    expect(form.getExcludedPoolIds(form.interfaces[0].key)).toEqual([OTHER_POOL_ID])
    expect(form.getExcludedPoolIds(form.interfaces[1].key)).toEqual([POOL.id])
  })

  it('excludes no pool for an interface without pool', () => {
    const { form } = mountForm()
    form.addInterface()

    expect(form.getExcludedPoolIds(form.interfaces[0].key)).toEqual([])
  })
})

describe('interfaceErrors', () => {
  it('lists, by interface number, the pool and the PIF missing', async () => {
    const { form } = mountForm()
    form.addInterface()
    await fillInterface(form, 1, { pool: OTHER_POOL_ID })

    expect(form.interfaceErrors).toEqual([
      { key: form.interfaces[0].key, number: 1, messages: [form.t('pif-required')] },
      { key: form.interfaces[1].key, number: 2, messages: [form.t('pif-required')] },
    ])
  })

  it('reports an interface missing both its pool and its PIF', () => {
    const { form } = mountForm(UNKNOWN_POOL_ID)

    expect(form.interfaceErrors).toEqual([
      { key: form.interfaces[0].key, number: 1, messages: [form.t('pool-required'), form.t('pif-required')] },
    ])
  })

  it('is empty once every interface has a pool and a PIF', async () => {
    const { form } = mountForm()
    await fillInterfaces(form)

    expect(form.interfaceErrors).toEqual([])
  })
})

describe('preferredCenterSelectBindings', () => {
  it('offers the hosts of the selected pools only, or none', async () => {
    const { wrapper, form } = mountForm()

    await openSelect(wrapper.get('.preferred-center'))

    expect(findSelectOptionLabels(wrapper)).toEqual([form.t('none'), HOST.name_label])
  })

  it('offers the hosts of a pool once an interface selects it', async () => {
    const { wrapper, form } = mountForm()
    await fillInterfaces(form)

    await openSelect(wrapper.get('.preferred-center'))

    expect(findSelectOptionLabels(wrapper)).toEqual([form.t('none'), HOST.name_label, OTHER_HOST.name_label])
  })

  it('forgets the preferred center once its pool is no longer selected', async () => {
    const { wrapper, form } = await mountCompleteForm()
    await choosePreferredCenter(wrapper, OTHER_HOST)

    form.removeInterface(1)
    await nextTick()

    expect(await form.validateAndBuildPayload()).not.toHaveProperty('preferredCenterId')
  })
})

describe('encryptedCheckboxBindings', () => {
  it('lets the network be encrypted by default', () => {
    const { form } = mountForm()

    expect(form.encryptedCheckboxBindings.disabled).toBe(false)
    expect(form.encryptionUnavailableMessage).toBeUndefined()
  })

  it('cannot encrypt when a selected pool has an encrypted network of each encapsulation', () => {
    xoCollectionsMock.networks.value = [
      createEncryptedNetwork(POOL.id, TUNNEL_PROTOCOL.GRE),
      createEncryptedNetwork(POOL.id, TUNNEL_PROTOCOL.VXLAN),
    ]
    const { form } = mountForm()

    expect(form.encryptedCheckboxBindings.disabled).toBe(true)
    expect(form.encryptionUnavailableMessage).toBe(form.t('new-network:encryption-unavailable'))
  })

  it('cannot encrypt when a selected pool already has an encrypted network of the chosen encapsulation', async () => {
    xoCollectionsMock.networks.value = [createEncryptedNetwork(OTHER_POOL_ID, TUNNEL_PROTOCOL.VXLAN)]
    const { form } = await mountCompleteForm()

    expect(form.encryptedCheckboxBindings.disabled).toBe(true)
    expect(form.encryptionUnavailableMessage).toBe(
      form.t('new-network:encapsulation-already-encrypted', { encapsulation: 'VxLAN' })
    )
  })

  it('can encrypt with the other encapsulation', async () => {
    xoCollectionsMock.networks.value = [createEncryptedNetwork(OTHER_POOL_ID, TUNNEL_PROTOCOL.GRE)]
    const { form } = await mountCompleteForm()

    expect(form.encryptedCheckboxBindings.disabled).toBe(false)
    expect(form.encryptionUnavailableMessage).toBeUndefined()
  })

  it('ignores the encrypted networks of the pools that are not selected', async () => {
    xoCollectionsMock.networks.value = [
      createEncryptedNetwork(OTHER_POOL_ID, TUNNEL_PROTOCOL.GRE),
      createEncryptedNetwork(OTHER_POOL_ID, TUNNEL_PROTOCOL.VXLAN),
    ]
    const { form } = mountForm()

    expect(form.encryptedCheckboxBindings.disabled).toBe(false)
  })

  it('unchecks the encryption once it becomes unavailable', async () => {
    xoCollectionsMock.networks.value = [createEncryptedNetwork(OTHER_POOL_ID, TUNNEL_PROTOCOL.VXLAN)]
    const { wrapper, form } = await mountCompleteForm()
    await chooseEncapsulation(wrapper, TUNNEL_PROTOCOL.GRE)
    form.encryptedCheckboxBindings['onUpdate:modelValue'](true)

    await chooseEncapsulation(wrapper, TUNNEL_PROTOCOL.VXLAN)

    expect(form.encryptedCheckboxBindings.modelValue).toBe(false)
  })
})

describe('validateAndBuildPayload', () => {
  it('builds the payload of a complete form, one PIF per pool, in the order of the interfaces', async () => {
    const { form } = await mountCompleteForm()

    expect(await form.validateAndBuildPayload()).toEqual({
      poolIds: [POOL.id, OTHER_POOL_ID],
      pifIds: [PIF_ID, OTHER_PIF_ID],
      name: 'Private network',
      description: '',
      encapsulation: TUNNEL_PROTOCOL.VXLAN,
      encrypted: false,
    })
  })

  it('sends the MTU, the preferred center and the encryption once chosen', async () => {
    const { wrapper, form } = await mountCompleteForm()
    form.mtuInputBindings['onUpdate:modelValue'](1450)
    form.encryptedCheckboxBindings['onUpdate:modelValue'](true)
    await choosePreferredCenter(wrapper, OTHER_HOST)

    expect(await form.validateAndBuildPayload()).toMatchObject({
      mtu: 1450,
      encrypted: true,
      preferredCenterId: OTHER_HOST.id,
    })
  })

  it('builds no payload without name, and reports it', async () => {
    const { form } = await mountCompleteForm()
    form.nameInputBindings['onUpdate:modelValue']('')

    expect(await form.validateAndBuildPayload()).toBeUndefined()
    await flushPromises()
    expect(form.nameInputBindings.error).toEqual(dangerMessage(form.t('name-required')))
  })

  it('builds no payload without encapsulation, and reports it', async () => {
    const { form } = mountForm()
    form.nameInputBindings['onUpdate:modelValue']('Private network')
    await fillInterfaces(form)

    expect(await form.validateAndBuildPayload()).toBeUndefined()
    await flushPromises()
    expect(form.encapsulationSelectBindings.error).toEqual(dangerMessage(form.t('encapsulation-required')))
  })

  it('builds no payload while an interface is incomplete, and shows the interface errors', async () => {
    const { form } = await mountCompleteForm()
    await fillInterface(form, 1, { pool: OTHER_POOL_ID })

    expect(form.showInterfaceErrors).toBe(false)
    expect(await form.validateAndBuildPayload()).toBeUndefined()
    expect(form.showInterfaceErrors).toBe(true)
  })
})
