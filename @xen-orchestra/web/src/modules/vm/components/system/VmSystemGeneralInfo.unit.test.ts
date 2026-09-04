import VmSystemGeneralInfo from '@/modules/vm/components/system/VmSystemGeneralInfo.vue'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createVm } from '@/test/create-vm.ts'
import { findLabelledValues } from '@/test/find-labelled-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { VM_POWER_STATE } from '@vates/types'
import { mount } from '@vue/test-utils'

function mountGeneralInfo(vm: FrontXoVm = createVm()) {
  return mount(VmSystemGeneralInfo, {
    props: { vm },
    global: createGlobalTestConfig(),
  })
}

it('renders the card title', () => {
  const wrapper = mountGeneralInfo()

  expect(wrapper.get('.ui-title').text()).toBe('General information')
})

it('shows the identity, operating system and guest tools of the VM', () => {
  const wrapper = mountGeneralInfo(
    createVm({
      name_label: 'Web server',
      id: 'vm-42' as FrontXoVm['id'],
      name_description: 'Serves the website',
      tags: ['production'],
      os_version: { name: 'Debian Bookworm', uname: '6.1.0-18-amd64' } as FrontXoVm['os_version'],
      pvDriversVersion: '7.5.0',
      power_state: VM_POWER_STATE.RUNNING,
      managementAgentDetected: true,
      pvDriversDetected: true,
      pvDriversUpToDate: true,
    })
  )

  expect(findLabelledValues(wrapper)).toEqual({
    Name: 'Web server',
    ID: 'vm-42',
    Description: 'Serves the website',
    Tags: 'production',
    'OS name': 'Debian Bookworm',
    'OS kernel': '6.1.0-18-amd64',
    'Management agent version': '7.5.0',
    'Guest tools': '7.5.0',
  })
})

it('leaves the operating system rows empty when the VM reports no OS version', () => {
  const wrapper = mountGeneralInfo(createVm({ os_version: null }))

  expect(findLabelledValues(wrapper)).toMatchObject({ 'OS name': '', 'OS kernel': '' })
})

it('renders one tag per VM tag', () => {
  const wrapper = mountGeneralInfo(createVm({ tags: ['production', 'billing'] }))

  expect(wrapper.findAll('.ui-tag').map(tag => tag.text())).toEqual(['production', 'billing'])
})

it('renders no tag when the VM has none', () => {
  const wrapper = mountGeneralInfo(createVm({ tags: [] }))

  expect(wrapper.find('.ui-tag').exists()).toBe(false)
  expect(findLabelledValues(wrapper)).toMatchObject({ Tags: '' })
})

it('shows the guest tools as not applicable when the VM is not running', () => {
  const wrapper = mountGeneralInfo(createVm({ power_state: VM_POWER_STATE.HALTED }))

  expect(findLabelledValues(wrapper)).toMatchObject({ 'Guest tools': '-' })
})
