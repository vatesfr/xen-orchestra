import NewTrafficRuleDrawer from '@/modules/traffic-rules/components/drawer/NewTrafficRuleDrawer.vue'
import { createNetwork } from '@/test/create-network.ts'
import { createPif } from '@/test/create-pif.ts'
import { createPool } from '@/test/create-pool.ts'
import { createVif } from '@/test/create-vif.ts'
import { cancelDrawer, submitDrawer } from '@/test/drawer.ts'
import { getInputWrapper } from '@/test/find-input-labels.ts'
import { dangerMessage } from '@/test/form-messages.ts'
import { t } from '@/test/i18n.ts'
import { xoCollectionsMock, mockXoCollections } from '@/test/mock-xo-collections.ts'
import { vmCollectionMock, mockXoVmCollection } from '@/test/mock-xo-vm-collection.ts'
import { vmDeviceCollectionsMock, mockXoVmDeviceCollections } from '@/test/mock-xo-vm-device-collections.ts'
import { mountWithProps } from '@/test/mount-with-props.ts'
import VtsRequiredHint from '@core/components/required-hint/VtsRequiredHint.vue'
import { flushPromises, type VueWrapper } from '@vue/test-utils'

mockXoCollections('pool', 'network', 'pif')

mockXoVmDeviceCollections('vif')

mockXoVmCollection()

const POOL = createPool()

const PIF = createPif()

const NETWORK = createNetwork({ $pool: POOL.id, PIFs: [PIF.id] })

// Opened from the traffic rules of a VIF, the drawer targets that VIF
const VIF = createVif({ $pool: POOL.id, $network: NETWORK.id })

beforeEach(() => {
  xoCollectionsMock.reset()
  vmCollectionMock.reset()
  vmDeviceCollectionsMock.reset()
  xoCollectionsMock.pools.value = [POOL]
  xoCollectionsMock.networks.value = [NETWORK]
  xoCollectionsMock.pifs.value = [PIF]
  vmDeviceCollectionsMock.vifs.value = [VIF]
})

async function mountDrawer() {
  const wrapper = mountWithProps(NewTrafficRuleDrawer, { poolId: POOL.id, vifId: VIF.id })
  await flushPromises()

  return wrapper
}

async function setField(wrapper: VueWrapper, label: string, value: string) {
  await getInputWrapper(wrapper, label).get('input').setValue(value)
}

it('tells which fields are required', async () => {
  expect((await mountDrawer()).findComponent(VtsRequiredHint).exists()).toBe(true)
})

describe('confirm', () => {
  it('does not confirm a rule without IP address nor port, and tells what is missing', async () => {
    const wrapper = await mountDrawer()

    await submitDrawer(wrapper)

    expect(wrapper.emitted('confirm')).toBeUndefined()
    // The IP address field also explains which values it accepts
    expect(getInputWrapper(wrapper, t('ip-address')).props('message')).toContainEqual(
      dangerMessage(t('ip-address-required'))
    )
    expect(getInputWrapper(wrapper, t('port')).props('message')).toEqual([dangerMessage(t('port-required'))])
  })

  it('confirms with the traffic rule to create on the VIF', async () => {
    const wrapper = await mountDrawer()
    await setField(wrapper, t('ip-address'), '10.0.0.1')
    await setField(wrapper, t('port'), '80')

    await submitDrawer(wrapper)

    expect(wrapper.emitted('confirm')).toEqual([
      [
        {
          targetType: 'VIF',
          targetId: VIF.id,
          allow: true,
          direction: 'from',
          protocol: 'TCP',
          ipRange: '10.0.0.1',
          port: 80,
        },
      ],
    ])
  })
})

it('cancels from the cancel button', async () => {
  const wrapper = await mountDrawer()

  await cancelDrawer(wrapper)

  expect(wrapper.emitted('cancel')).toHaveLength(1)
})
