import VmDeleteButton from '@/modules/vm/components/actions/delete/VmDeleteButton.vue'
import { createVm } from '@/test/create-vm.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { vmDeleteMock } from '@/test/mock-vm-delete.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import MenuTrigger from '@core/components/menu/MenuTrigger.vue'
import { mount } from '@vue/test-utils'
import { toValue } from 'vue'

// The composable calls the REST API and opens modals
vi.mock(import('@/modules/vm/composables/use-vm-delete.composable.ts'), () => import('@/test/mock-vm-delete.ts'))

beforeEach(() => {
  vmDeleteMock.reset()
})

const VM = createVm()

function mountButton() {
  return mount(VmDeleteButton, { props: { vm: VM }, global: createGlobalTestConfig() })
}

it('offers to delete the VM', () => {
  const menuItem = mountButton().getComponent(MenuItem)

  expect([menuItem.text(), menuItem.props('icon'), menuItem.props('accent')]).toEqual([
    t('action:delete'),
    'action:delete',
    'danger',
  ])
})

it('deletes the VM it is given', () => {
  mountButton()

  expect(toValue(vmDeleteMock.useVmDelete.mock.lastCall?.[0])).toEqual(VM)
})

it('deletes the VM when clicking the menu item', async () => {
  await mountButton().getComponent(MenuTrigger).trigger('click')

  expect(vmDeleteMock.deleteVm).toHaveBeenCalledOnce()
})

it('shows the menu item as busy while the VM is being deleted', () => {
  vmDeleteMock.setDeleting(true)

  expect(mountButton().getComponent(MenuItem).props('busy')).toBe(true)
})
