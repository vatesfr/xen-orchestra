import MenuItem from '@core/components/menu/MenuItem.vue'
import type { VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'

export function findHeadBarActionLabels(wrapper: VueWrapper) {
  return Array.from(wrapper.get('.vts-head-bar-actions').element.children, action => action.textContent.trim()).filter(
    label => label !== ''
  )
}

export async function openMoreActions(wrapper: VueWrapper) {
  await wrapper.get('button.ui-button-icon').trigger('click')
  await nextTick()
}

export function findMenuEntries(wrapper: VueWrapper) {
  const menuItem = wrapper.findComponent(MenuItem)

  if (!menuItem.exists()) {
    return []
  }

  const menu: Element | null = menuItem.element.closest('ul.menu-list')

  if (menu === null) {
    return []
  }

  return Array.from(menu.children, entry => entry.textContent.trim())
}

export function findMenuEntryIndex(wrapper: VueWrapper, label: string) {
  return findMenuEntries(wrapper).findIndex(entry => entry.startsWith(label))
}
