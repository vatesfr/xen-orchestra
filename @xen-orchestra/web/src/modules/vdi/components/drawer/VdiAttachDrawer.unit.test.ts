import VdiAttachDrawer from '@/modules/vdi/components/drawer/VdiAttachDrawer.vue'
import { createSr } from '@/test/create-sr.ts'
import { createVdi } from '@/test/create-vdi.ts'
import { createVm } from '@/test/create-vm.ts'
import { cancelDrawer, submitDrawer } from '@/test/drawer.ts'
import { getInputWrapper } from '@/test/find-input-labels.ts'
import { dangerMessage } from '@/test/form-messages.ts'
import { t } from '@/test/i18n.ts'
import { xoCollectionsMock, mockXoCollections } from '@/test/mock-xo-collections.ts'
import { mockXoVmDeviceCollections, vmDeviceCollectionsMock } from '@/test/mock-xo-vm-device-collections.ts'
import { mountWithProps } from '@/test/mount-with-props.ts'
import VtsRequiredHint from '@core/components/required-hint/VtsRequiredHint.vue'
import { findSelectOptionLabels, openSelect, pickSelectOption } from '@core-test/select.ts'
import { VBD_MODE } from '@vates/types'
import { flushPromises, type VueWrapper } from '@vue/test-utils'

mockXoCollections('pool', 'host', 'sr', 'pbd')
mockXoVmDeviceCollections('vbd', 'vdi')

const VM = createVm()

const VDI = createVdi()

const SR = createSr({ id: VDI.$SR, $pool: VM.$pool, VDIs: [VDI.id] })

beforeEach(() => {
  xoCollectionsMock.reset()
  vmDeviceCollectionsMock.reset()
  xoCollectionsMock.srs.value = [SR]
  vmDeviceCollectionsMock.vdis.value = [VDI]
})

async function mountDrawer() {
  const wrapper = mountWithProps(VdiAttachDrawer, { vm: VM })
  await flushPromises()

  return wrapper
}

async function fillDrawer(wrapper: VueWrapper) {
  await openSelect(getInputWrapper(wrapper, t('storage-repository')))
  // The only SR of the pool of the VM
  await pickSelectOption(wrapper, findSelectOptionLabels(wrapper)[0])
  await openSelect(getInputWrapper(wrapper, t('vdi')))
  await pickSelectOption(wrapper, VDI.name_label)
}

function getMessage(wrapper: VueWrapper, label: string) {
  return getInputWrapper(wrapper, label).props('message')
}

it('tells which fields are required', async () => {
  expect((await mountDrawer()).findComponent(VtsRequiredHint).exists()).toBe(true)
})

describe('confirm', () => {
  it('does not confirm without a VDI, and tells what is missing', async () => {
    const wrapper = await mountDrawer()

    await submitDrawer(wrapper)

    expect(wrapper.emitted('confirm')).toBeUndefined()
    expect(getMessage(wrapper, t('storage-repository'))).toEqual([dangerMessage(t('sr-required'))])
    expect(getMessage(wrapper, t('vdi'))).toEqual([dangerMessage(t('vdi-required'))])
  })

  it('confirms with the VDI to attach to the VM', async () => {
    const wrapper = await mountDrawer()
    await fillDrawer(wrapper)

    await submitDrawer(wrapper)

    expect(wrapper.emitted('confirm')).toEqual([[{ VM: VM.id, VDI: VDI.id, mode: VBD_MODE.RW }]])
  })
})

it('cancels from the cancel button', async () => {
  const wrapper = await mountDrawer()

  await cancelDrawer(wrapper)

  expect(wrapper.emitted('cancel')).toHaveLength(1)
})
