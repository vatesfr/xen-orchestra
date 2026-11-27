import GroupTreeItem from '@/modules/treeview/components/GroupTreeItem.vue'
import type { GroupBranch, TreeGroup } from '@/modules/treeview/types/tree.type.ts'
import { createVm } from '@/test/create-vm.ts'
import { getButton } from '@/test/get-button.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { defineTree } from '@core/packages/tree/define-tree.ts'
import { useTree } from '@core/packages/tree/use-tree.ts'
import { mount } from '@vue/test-utils'

const group: TreeGroup = { id: 'group', label: 'Group', icon: 'fa:server' }

function mountGroup() {
  const { nodes } = useTree(
    defineTree('groups', [group], { discriminator: 'group' }, () =>
      defineTree('vms', [createVm()], { getLabel: 'name_label', discriminator: 'vm' })
    )
  )

  const branch = nodes.value[0] as GroupBranch

  const wrapper = mount(GroupTreeItem, {
    props: { branch },
    global: createGlobalTestConfig(),
  })

  return { wrapper, branch }
}

it('shows the label of its group', () => {
  const { wrapper } = mountGroup()

  expect(wrapper.text()).toBe(group.label)
})

it('collapses its group when its label is clicked, and expands it back', async () => {
  const { wrapper, branch } = mountGroup()

  await wrapper.get('.label').trigger('click')

  expect(branch.isCollapsed).toBe(true)

  await wrapper.get('.label').trigger('click')

  expect(branch.isCollapsed).toBe(false)
})

it('collapses its group when its toggle is clicked', async () => {
  const { wrapper, branch } = mountGroup()

  await getButton(wrapper, t('action:close')).trigger('click')

  expect(branch.isCollapsed).toBe(true)
})
