import NewVdiDrawer from '@/modules/vdi/components/drawer/NewVdiDrawer.vue'
import { ONE_GB, VDI_SOURCE } from '@/shared/constants.ts'
import { createSr } from '@/test/create-sr.ts'
import { createVm } from '@/test/create-vm.ts'
import { cancelDrawer, submitDrawer } from '@/test/drawer.ts'
import { getInputWrapper } from '@/test/find-input-labels.ts'
import { dangerMessage } from '@/test/form-messages.ts'
import { t } from '@/test/i18n.ts'
import { xoCollectionsMock, mockXoCollections } from '@/test/mock-xo-collections.ts'
import { mockXoVmDeviceCollections, vmDeviceCollectionsMock } from '@/test/mock-xo-vm-device-collections.ts'
import { mountWithProps } from '@/test/mount-with-props.ts'
import { findSelectOptionLabels, openSelect, pickSelectOption } from '@/test/select.ts'
import VtsRequiredHint from '@core/components/required-hint/VtsRequiredHint.vue'
import { flushPromises, type VueWrapper } from '@vue/test-utils'

mockXoCollections('pool', 'host', 'sr', 'pbd')
mockXoVmDeviceCollections('vbd', 'vdi')

const VM = createVm()

const SR = createSr({ $pool: VM.$pool })

beforeEach(() => {
  xoCollectionsMock.reset()
  vmDeviceCollectionsMock.reset()
  xoCollectionsMock.srs.value = [SR]
})

async function mountDrawer() {
  const wrapper = mountWithProps(NewVdiDrawer, { vm: VM })
  await flushPromises()

  return wrapper
}

async function setAllocatedSpace(wrapper: VueWrapper, value: string) {
  await getInputWrapper(wrapper, t('allocated-space')).get('input').setValue(value)
}

async function fillDrawer(wrapper: VueWrapper) {
  await openSelect(getInputWrapper(wrapper, t('storage-repository')))
  // The only SR of the pool of the VM
  await pickSelectOption(wrapper, findSelectOptionLabels(wrapper)[0])
  await getInputWrapper(wrapper, t('vdi-name')).get('input').setValue('VDI')
  await setAllocatedSpace(wrapper, '10')
}

function getMessage(wrapper: VueWrapper, label: string) {
  return getInputWrapper(wrapper, label).props('message')
}

it('tells which fields are required', async () => {
  expect((await mountDrawer()).findComponent(VtsRequiredHint).exists()).toBe(true)
})

describe('confirm', () => {
  it('does not confirm an incomplete VDI, and tells what is missing', async () => {
    const wrapper = await mountDrawer()

    await submitDrawer(wrapper)

    expect(wrapper.emitted('confirm')).toBeUndefined()
    expect(getMessage(wrapper, t('storage-repository'))).toEqual([dangerMessage(t('sr-required'))])
    expect(getMessage(wrapper, t('vdi-name'))).toEqual(dangerMessage(t('name-required')))
    expect(getMessage(wrapper, t('allocated-space'))).toEqual(dangerMessage(t('allocated-space-required')))
  })

  it('does not confirm a VDI without allocated space', async () => {
    const wrapper = await mountDrawer()
    await fillDrawer(wrapper)
    await setAllocatedSpace(wrapper, '0')

    await submitDrawer(wrapper)

    expect(wrapper.emitted('confirm')).toBeUndefined()
    expect(getMessage(wrapper, t('allocated-space'))).toEqual(dangerMessage(t('form:error:minimum', { min: 1 })))
  })

  it('confirms with the VDI to create on the VM', async () => {
    const wrapper = await mountDrawer()
    await fillDrawer(wrapper)

    await submitDrawer(wrapper)

    expect(wrapper.emitted('confirm')).toEqual([
      [{ source: VDI_SOURCE.EMPTY, srId: SR.id, name_label: 'VDI', virtual_size: 10 * ONE_GB, vm: VM.id }],
    ])
  })
})

it('cancels from the cancel button', async () => {
  const wrapper = await mountDrawer()

  await cancelDrawer(wrapper)

  expect(wrapper.emitted('cancel')).toHaveLength(1)
})
