import VmSystemVirtualizationAndBoot from '@/modules/vm/components/system/VmSystemVirtualizationAndBoot.vue'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createVm } from '@/test/create-vm.ts'
import { findLabelledValues } from '@/test/find-rendered-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount } from '@vue/test-utils'

function mountVirtualizationAndBoot(vm: FrontXoVm = createVm()) {
  return mount(VmSystemVirtualizationAndBoot, {
    props: { vm },
    global: createGlobalTestConfig(),
  })
}

it('renders the card title', () => {
  const wrapper = mountVirtualizationAndBoot()

  expect(wrapper.get('.ui-title').text()).toBe(t('virtualization-boot-settings'))
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
    [t('virtualization-mode')]: 'pv',
    [t('secure-boot')]: t('enabled'),
    [t('boot-firmware')]: 'uefi',
    [t('virtual-tpm')]: 'vtpm-1, vtpm-2',
    [t('viridian')]: t('enabled'),
    [t('manage-citrix-pv-drivers-via-windows-update')]: t('enabled'),
    [t('nested-virtualization')]: t('enabled'),
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
    [t('virtualization-mode')]: 'hvm',
    [t('secure-boot')]: t('disabled'),
    [t('boot-firmware')]: '',
    [t('virtual-tpm')]: t('none'),
    [t('viridian')]: t('disabled'),
    [t('manage-citrix-pv-drivers-via-windows-update')]: t('disabled'),
    [t('nested-virtualization')]: t('disabled'),
  })
})
