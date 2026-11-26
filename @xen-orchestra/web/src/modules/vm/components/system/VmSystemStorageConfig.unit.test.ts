import VmSystemStorageConfig from '@/modules/vm/components/system/VmSystemStorageConfig.vue'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { itRendersCardTitle } from '@/test/card-title.ts'
import { createVm } from '@/test/create-vm.ts'
import { findTitleLabel } from '@/test/find-card-title.ts'
import { findLabelledValues } from '@/test/find-rendered-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount } from '@vue/test-utils'

function mountStorageConfig(vm: FrontXoVm = createVm()) {
  return mount(VmSystemStorageConfig, {
    props: { vm },
    global: createGlobalTestConfig(),
  })
}

itRendersCardTitle(mountStorageConfig, t('storage-configuration'), findTitleLabel)

it('shows the suspend storage repository of the VM', () => {
  const wrapper = mountStorageConfig(createVm({ suspendSr: 'sr-1' as FrontXoVm['suspendSr'] }))

  expect(findLabelledValues(wrapper)).toEqual({ [t('suspend-storage-repository')]: 'sr-1' })
})

it('falls back to "None" when the VM has no suspend storage repository', () => {
  const wrapper = mountStorageConfig(createVm({ suspendSr: undefined }))

  expect(findLabelledValues(wrapper)).toEqual({ [t('suspend-storage-repository')]: t('none') })
})
