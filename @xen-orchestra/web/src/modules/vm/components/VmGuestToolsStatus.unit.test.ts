import VmGuestToolsStatus from '@/modules/vm/components/VmGuestToolsStatus.vue'
import type { GuestToolsDisplay } from '@/modules/vm/composables/xo-vm-utils.composable.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { mount } from '@vue/test-utils'

function mountGuestToolsStatus(guestToolsDisplay: GuestToolsDisplay) {
  return mount(VmGuestToolsStatus, {
    props: { guestToolsDisplay },
    global: createGlobalTestConfig(),
  })
}

it('shows a dash without any status icon when guest tools do not apply', () => {
  const wrapper = mountGuestToolsStatus({ type: 'not-applicable', value: '-' })

  expect(wrapper.text()).toBe('-')
  expect(wrapper.find('.vts-icon').exists()).toBe(false)
})

it('links to the guest tools documentation when they are missing', () => {
  const wrapper = mountGuestToolsStatus({
    type: 'missing',
    icon: 'status:halted-circle',
    value: 'Install guest tools',
    tooltip: 'No Xen tools detected',
  })

  const link = wrapper.get('a')

  expect(link.text()).toBe('Install guest tools')
  expect(link.attributes('href')).toBe('https://docs.xcp-ng.org/vms/#guest-tools')
})

it('shows the guest tools version as plain text when they are installed', () => {
  const wrapper = mountGuestToolsStatus({
    type: 'up-to-date',
    icon: 'status:success-circle',
    value: '7.5.0',
    tooltip: 'Installed',
  })

  expect(wrapper.text()).toBe('7.5.0')
  expect(wrapper.find('a').exists()).toBe(false)
  expect(wrapper.find('.vts-icon').exists()).toBe(true)
})

it('shows the version alongside a status icon when the guest tools are out of date', () => {
  const wrapper = mountGuestToolsStatus({
    type: 'outdated',
    icon: 'status:warning-circle',
    value: '7.5.0',
    tooltip: 'Guest tools out of date',
  })

  expect(wrapper.text()).toBe('7.5.0')
  expect(wrapper.find('.vts-icon').exists()).toBe(true)
})
