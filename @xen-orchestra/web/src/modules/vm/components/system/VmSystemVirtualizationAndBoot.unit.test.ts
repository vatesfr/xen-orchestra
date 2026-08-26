import VmSystemVirtualizationAndBoot from '@/modules/vm/components/system/VmSystemVirtualizationAndBoot.vue'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createVm } from '@/test/create-vm.ts'
import { findLabelledValues } from '@/test/find-labelled-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { mount } from '@vue/test-utils'

function mountVirtualizationAndBoot(vm: FrontXoVm = createVm()) {
  return mount(VmSystemVirtualizationAndBoot, {
    props: { vm },
    global: createGlobalTestConfig(),
  })
}

it('renders the card title', () => {
  const wrapper = mountVirtualizationAndBoot()

  expect(wrapper.get('.ui-title').text()).toBe('Virtualization & boot settings')
})

it('shows every enabled virtualization and boot setting', () => {
  const wrapper = mountVirtualizationAndBoot(
    createVm({
      virtualizationMode: 'pv',
      secureBoot: true,
      boot: { firmware: 'uefi' } as FrontXoVm['boot'],
      VTPMs: ['vtpm-1', 'vtpm-2'] as FrontXoVm['VTPMs'],
      viridian: true,
      hasVendorDevice: true,
      isNestedVirtEnabled: true,
    })
  )

  expect(findLabelledValues(wrapper)).toEqual({
    'Virtualization mode': 'pv',
    'Secure boot': 'Enabled',
    'Boot firmware': 'uefi',
    'Virtual TPM (VTPM)': 'vtpm-1, vtpm-2',
    Viridian: 'Enabled',
    'Manage citrix PV drivers via Windows Update': 'Enabled',
    'Nested virtualization': 'Enabled',
  })
})

it('shows every disabled setting and falls back for the missing values', () => {
  const wrapper = mountVirtualizationAndBoot(
    createVm({
      virtualizationMode: 'hvm',
      secureBoot: false,
      boot: {} as FrontXoVm['boot'],
      VTPMs: [],
      viridian: false,
      hasVendorDevice: false,
      isNestedVirtEnabled: false,
    })
  )

  expect(findLabelledValues(wrapper)).toEqual({
    'Virtualization mode': 'hvm',
    'Secure boot': 'Disabled',
    'Boot firmware': '',
    'Virtual TPM (VTPM)': 'None',
    Viridian: 'Disabled',
    'Manage citrix PV drivers via Windows Update': 'Disabled',
    'Nested virtualization': 'Disabled',
  })
})
