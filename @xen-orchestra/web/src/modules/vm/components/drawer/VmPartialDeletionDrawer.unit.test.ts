import VmPartialDeletionDrawer from '@/modules/vm/components/drawer/VmPartialDeletionDrawer.vue'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createVm } from '@/test/create-vm.ts'
import { findTableRows } from '@/test/find-rendered-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount } from '@vue/test-utils'

const webServer = createVm({ id: 'vm-1' as FrontXoVm['id'], name_label: 'Web server' })
const database = createVm({ id: 'vm-2' as FrontXoVm['id'], name_label: 'Database' })
const backupServer = createVm({ id: 'vm-3' as FrontXoVm['id'], name_label: 'Backup server' })

function mountDrawer(deletableVms: FrontXoVm[] = [webServer, database], protectedVms: FrontXoVm[] = [backupServer]) {
  return mount(VmPartialDeletionDrawer, {
    props: { deletableVms, protectedVms },
    global: createGlobalTestConfig(),
  })
}

async function openProtectedTab(wrapper: ReturnType<typeof mountDrawer>) {
  const protectedTab = wrapper.findAll('.ui-tab-item').find(tab => tab.text() === t('protected-vms'))

  await protectedTab?.trigger('click')
}

it('explains how many VMs are protected and how many will be deleted', () => {
  const summary = mountDrawer()
    .findAll('.summary p')
    .map(paragraph => paragraph.text())

  expect(summary).toEqual([
    t('n-vms-protected-against-deletion', { n: 1 }),
    t('only-n-of-total-vms-will-be-deleted', { n: 2, total: 3 }),
  ])
})

it('lists the VMs to delete by default', () => {
  expect(findTableRows(mountDrawer())).toEqual([['Web server'], ['Database']])
})

it('lists the protected VMs in their own tab', async () => {
  const wrapper = mountDrawer()

  await openProtectedTab(wrapper)

  expect(findTableRows(wrapper)).toEqual([['Backup server']])
})

it('names the number of VMs to delete on the confirm button', () => {
  const confirmButton = mountDrawer().get('button[type="submit"]')

  expect(confirmButton.text()).toBe(t('action:delete-n-vms', { n: 2 }))
})

it('confirms the deletion when submitted', async () => {
  const wrapper = mountDrawer()

  await wrapper.get('form').trigger('submit')

  expect(wrapper.emitted('confirm')).toHaveLength(1)
})
