import VmDuplicateDrawer from '@/modules/vm/components/drawer/VmDuplicateDrawer.vue'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createSr } from '@/test/create-sr.ts'
import { createVm } from '@/test/create-vm.ts'
import { cancelDrawer, submitDrawer } from '@/test/drawer.ts'
import { getInputWrapper } from '@/test/find-input-labels.ts'
import { dangerMessage } from '@/test/form-messages.ts'
import { t } from '@/test/i18n.ts'
import { xoCollectionsMock, mockXoCollections } from '@/test/mock-xo-collections.ts'
import { mountWithProps } from '@/test/mount-with-props.ts'
import VtsRequiredHint from '@core/components/required-hint/VtsRequiredHint.vue'
import { chooseSelectOption } from '@core-test/select.ts'
import { VM_POWER_STATE } from '@vates/types'
import { flushPromises, type VueWrapper } from '@vue/test-utils'

mockXoCollections('pool', 'host', 'sr', 'pbd')

// A running VM can only be fully copied, on a storage repository to pick
const VM = createVm({ power_state: VM_POWER_STATE.RUNNING })

const SR = createSr()

beforeEach(() => {
  xoCollectionsMock.reset()
  xoCollectionsMock.srs.value = [SR]
})

async function mountDrawer(vm: FrontXoVm = VM) {
  const wrapper = mountWithProps(VmDuplicateDrawer, { vm })
  await flushPromises()

  return wrapper
}

async function pickSr(wrapper: VueWrapper) {
  // An SR option shows its free space and location after its name
  await chooseSelectOption(wrapper, SR.name_label, {
    container: getInputWrapper(wrapper, t('storage-repository')),
    detailed: true,
  })
}

it('tells which fields are required', async () => {
  expect((await mountDrawer()).findComponent(VtsRequiredHint).exists()).toBe(true)
})

describe('confirm', () => {
  it('does not confirm a full copy without a storage repository', async () => {
    const wrapper = await mountDrawer()

    await submitDrawer(wrapper)

    expect(wrapper.emitted('confirm')).toBeUndefined()
    expect(getInputWrapper(wrapper, t('storage-repository')).props('message')).toEqual(dangerMessage(t('sr-required')))
  })

  it('does not confirm a copy without a name', async () => {
    const wrapper = await mountDrawer()
    await pickSr(wrapper)
    await getInputWrapper(wrapper, t('vm-name')).get('input').setValue('')

    await submitDrawer(wrapper)

    expect(wrapper.emitted('confirm')).toBeUndefined()
    expect(getInputWrapper(wrapper, t('vm-name')).props('message')).toEqual(dangerMessage(t('vm-name-required')))
  })

  it('confirms with the full copy of the VM on the storage repository', async () => {
    const wrapper = await mountDrawer()
    await pickSr(wrapper)

    await submitDrawer(wrapper)

    expect(wrapper.emitted('confirm')).toEqual([[{ name_label: `${VM.name_label}_COPY`, srId: SR.id }]])
  })

  it('confirms with the fast clone of a halted VM', async () => {
    const vm = createVm({ power_state: VM_POWER_STATE.HALTED })
    const wrapper = await mountDrawer(vm)

    await submitDrawer(wrapper)

    expect(wrapper.emitted('confirm')).toEqual([[{ name_label: `${vm.name_label}_COPY`, fast: true }]])
  })
})

it('cancels from the cancel button', async () => {
  const wrapper = await mountDrawer()

  await cancelDrawer(wrapper)

  expect(wrapper.emitted('cancel')).toHaveLength(1)
})
