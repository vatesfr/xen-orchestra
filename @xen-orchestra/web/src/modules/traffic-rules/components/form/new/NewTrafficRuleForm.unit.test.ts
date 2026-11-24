import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import TrafficRuleFormSelect from '@/modules/traffic-rules/components/form/inputs/TrafficRuleFormSelect.vue'
import NewTrafficRuleForm from '@/modules/traffic-rules/components/form/new/NewTrafficRuleForm.vue'
import type { FrontXoVif } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createPool } from '@/test/create-pool.ts'
import { createVm } from '@/test/create-vm.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { xoCollectionsMock, mockXoCollections } from '@/test/mock-xo-collections.ts'
import { vmCollectionMock, mockXoVmCollection } from '@/test/mock-xo-vm-collection.ts'
import { vmDeviceCollectionsMock, mockXoVmDeviceCollections } from '@/test/mock-xo-vm-device-collections.ts'
import VtsDetailedOption from '@core/components/select/VtsDetailedOption.vue'
import { chooseSelectOption, openSelect } from '@core-test/select.ts'
import { SDN_CONTROLLER_OF_METHOD_KEY, VM_OPERATIONS } from '@vates/types'
import { mount } from '@vue/test-utils'

mockXoCollections('pool', 'network', 'pif')

mockXoVmDeviceCollections('vif')

mockXoVmCollection()

const XAPI_PLUGIN_POOL = createPool({ otherConfig: { [SDN_CONTROLLER_OF_METHOD_KEY]: 'xapi-plugin' } })

const OPENFLOW_POOL = createPool({ otherConfig: {} })

beforeEach(() => {
  xoCollectionsMock.reset()
  vmCollectionMock.reset()
  vmDeviceCollectionsMock.reset()
})

function mountForm(pool: FrontXoPool) {
  xoCollectionsMock.pools.value = [pool]

  return mount(NewTrafficRuleForm, {
    props: { poolId: pool.id, cancelTo: '/' },
    global: createGlobalTestConfig({ stubs: { NewTrafficRuleButtonsSection: true } }),
  })
}

type Form = ReturnType<typeof mountForm>

function getFormSelect(wrapper: Form, label: string) {
  const select = wrapper.findAllComponents(TrafficRuleFormSelect).find(select => select.props('label') === label)

  if (select === undefined) {
    throw new Error(`No select labelled "${label}"`)
  }

  return select
}

function findDetailedOptions(wrapper: Form) {
  return wrapper.findAllComponents(VtsDetailedOption).map(option => ({
    label: option.props('option').properties.label,
    iconTooltip: option.props('iconTooltip'),
    details: option.props('details'),
  }))
}

describe('object', () => {
  it('explains that a network rule requires the XAPI plugin mode', async () => {
    const wrapper = mountForm(OPENFLOW_POOL)

    await openSelect(getFormSelect(wrapper, t('object')))

    expect(findDetailedOptions(wrapper)).toEqual([
      { label: t('network'), iconTooltip: undefined, details: t('traffic-rules:xapi-plugin-required') },
      { label: t('vif'), iconTooltip: undefined, details: undefined },
    ])
  })

  it('details no option when the pool supports network rules', async () => {
    const wrapper = mountForm(XAPI_PLUGIN_POOL)

    await openSelect(getFormSelect(wrapper, t('object')))

    expect(findDetailedOptions(wrapper).map(option => option.details)).toEqual([undefined, undefined])
  })
})

describe('from VM', () => {
  it('explains which VMs have no VIF, with the operation in progress of each VM as icon tooltip', async () => {
    vmCollectionMock.vms.value = [
      createVm({
        id: 'vm-with-vif' as FrontXoVm['id'],
        name_label: 'VM with VIF',
        $pool: XAPI_PLUGIN_POOL.id,
        VIFs: ['vif-1' as FrontXoVif['id']],
        current_operations: { 'operation-1': VM_OPERATIONS.START },
      }),
      createVm({
        id: 'vm-without-vif' as FrontXoVm['id'],
        name_label: 'VM without VIF',
        $pool: XAPI_PLUGIN_POOL.id,
        VIFs: [],
      }),
    ]
    const wrapper = mountForm(XAPI_PLUGIN_POOL)

    await chooseSelectOption(wrapper, t('vif'), { container: getFormSelect(wrapper, t('object')) })
    await openSelect(getFormSelect(wrapper, t('from-vm')))

    expect(findDetailedOptions(wrapper)).toEqual([
      {
        label: 'VM with VIF',
        iconTooltip: t('operation-in-progress', { operation: t('operation:start') }),
        details: undefined,
      },
      { label: 'VM without VIF', iconTooltip: '', details: t('no-vif-detected') },
    ])
  })
})
