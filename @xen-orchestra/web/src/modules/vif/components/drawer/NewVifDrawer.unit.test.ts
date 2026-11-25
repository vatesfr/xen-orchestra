import NewVifDrawer from '@/modules/vif/components/drawer/NewVifDrawer.vue'
import { createNetwork } from '@/test/create-network.ts'
import { createVm } from '@/test/create-vm.ts'
import { cancelDrawer, submitDrawer } from '@/test/drawer.ts'
import { getInputWrapper } from '@/test/find-input-labels.ts'
import { dangerMessage } from '@/test/form-messages.ts'
import { t } from '@/test/i18n.ts'
import { xoCollectionsMock, mockXoCollections } from '@/test/mock-xo-collections.ts'
import { mountWithProps } from '@/test/mount-with-props.ts'
import VtsRequiredHint from '@core/components/required-hint/VtsRequiredHint.vue'
import { chooseSelectOption } from '@core-test/select.ts'
import { flushPromises } from '@vue/test-utils'

mockXoCollections('network', 'pif')

const VM = createVm()

const NETWORK = createNetwork({ $pool: VM.$pool })

beforeEach(() => {
  xoCollectionsMock.reset()
  xoCollectionsMock.networks.value = [NETWORK]
})

async function mountDrawer() {
  const wrapper = mountWithProps(NewVifDrawer, { vmId: VM.id, poolId: VM.$pool })
  await flushPromises()

  return wrapper
}

it('tells which fields are required', async () => {
  expect((await mountDrawer()).findComponent(VtsRequiredHint).exists()).toBe(true)
})

describe('confirm', () => {
  it('does not confirm a VIF without a network', async () => {
    const wrapper = await mountDrawer()

    await submitDrawer(wrapper)

    expect(wrapper.emitted('confirm')).toBeUndefined()
    expect(getInputWrapper(wrapper, t('network')).props('message')).toEqual(dangerMessage(t('network-required')))
  })

  it('confirms with the VIF to create on the VM of the page', async () => {
    const wrapper = await mountDrawer()
    await chooseSelectOption(wrapper, NETWORK.name_label, { container: getInputWrapper(wrapper, t('network')) })

    await submitDrawer(wrapper)

    expect(wrapper.emitted('confirm')).toEqual([
      [{ vmId: VM.id, networkId: NETWORK.id, other_config: { 'ethtool-tx': 'true' } }],
    ])
  })
})

it('cancels from the cancel button', async () => {
  const wrapper = await mountDrawer()

  await cancelDrawer(wrapper)

  expect(wrapper.emitted('cancel')).toHaveLength(1)
})
