import VmSystemGeneralInfo from '@/modules/vm/components/system/VmSystemGeneralInfo.vue'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { itRendersCardTitle } from '@/test/card-title.ts'
import { createVm } from '@/test/create-vm.ts'
import { findCopiedValues, findLabelledValues, findTags } from '@/test/find-rendered-values.ts'
import { findTitleLabel } from '@/test/find-titles.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { findTagProps } from '@core-test/find-accented-labels.ts'
import { VM_POWER_STATE } from '@vates/types'
import { mount } from '@vue/test-utils'

function mountGeneralInfo(vm: FrontXoVm = createVm()) {
  return mount(VmSystemGeneralInfo, {
    props: { vm },
    global: createGlobalTestConfig(),
  })
}

itRendersCardTitle(mountGeneralInfo, t('general-information'), findTitleLabel)

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
    [t('name')]: 'Web server',
    [t('id')]: 'vm-42',
    [t('description')]: 'Serves the website',
    [t('tags')]: 'production',
    [t('os-name')]: 'Debian Bookworm',
    [t('os-kernel')]: '6.1.0-18-amd64',
    [t('management-agent-version')]: '7.5.0',
    [t('guest-tools')]: '7.5.0',
  })
})

it('offers to copy the name and the ID of the VM', () => {
  const wrapper = mountGeneralInfo(createVm({ name_label: 'Web server', id: 'vm-42' as FrontXoVm['id'] }))

  expect(findCopiedValues(wrapper)).toEqual({ [t('name')]: 'Web server', [t('id')]: 'vm-42' })
})

it('leaves the operating system rows empty when the VM reports no OS version', () => {
  const wrapper = mountGeneralInfo(createVm({ os_version: null }))

  expect(findLabelledValues(wrapper)).toMatchObject({ [t('os-name')]: '', [t('os-kernel')]: '' })
})

it('renders one tag per VM tag, in alphabetical order', () => {
  const wrapper = mountGeneralInfo(createVm({ tags: ['production', 'billing'] }))

  expect(findTags(wrapper)).toEqual(['billing', 'production'])
})

it('renders the VM tags with the brand accent', () => {
  const wrapper = mountGeneralInfo(createVm({ tags: ['production', 'billing'] }))

  expect(findTagProps(wrapper, 'accent')).toEqual(['brand', 'brand'])
})

it('renders no tag when the VM has none', () => {
  const wrapper = mountGeneralInfo(createVm({ tags: [] }))

  expect(findTags(wrapper)).toEqual([])
  expect(findLabelledValues(wrapper)).toMatchObject({ [t('tags')]: '' })
})

it('shows the guest tools as not applicable when the VM is not running', () => {
  const wrapper = mountGeneralInfo(createVm({ power_state: VM_POWER_STATE.HALTED }))

  expect(findLabelledValues(wrapper)).toMatchObject({ [t('guest-tools')]: '-' })
})
