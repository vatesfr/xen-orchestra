import MenuItem from '@core/components/menu/MenuItem.vue'
import MenuTrigger from '@core/components/menu/MenuTrigger.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import type { VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'

type MenuWrapper = Pick<VueWrapper, 'findAllComponents'>

// Opens the menu of the more actions button (a `UiButtonIcon`), returns its `MenuItem`s in order; throws without one
export async function openMoreActions(wrapper: MenuWrapper) {
  const button = wrapper.findAllComponents(UiButtonIcon).find(found => found.props('icon') === 'action:more-actions')

  if (button === undefined) {
    throw new Error('No more actions button')
  }

  await button.trigger('click')
  await nextTick()

  return wrapper.findAllComponents(MenuItem)
}

// Opens the menu of the more actions button, returns the label of each of its `MenuItem`s, in order
export async function findMoreActionLabels(wrapper: MenuWrapper) {
  const items = await openMoreActions(wrapper)

  return items.map(item => item.text())
}

// The `MenuTrigger` labelled `label`, the first one without a label; throws without one
export function getMenuTrigger(wrapper: MenuWrapper, label?: string) {
  const triggers = wrapper.findAllComponents(MenuTrigger)
  const trigger = label === undefined ? triggers[0] : triggers.find(found => found.text() === label)

  if (trigger === undefined) {
    throw new Error(label === undefined ? 'No menu trigger' : `No menu trigger "${label}"`)
  }

  return trigger
}

// Clicks a menu item as the user does: runs its action, or opens its submenu
export async function clickMenuItem(wrapper: MenuWrapper, label?: string) {
  await getMenuTrigger(wrapper, label).trigger('click')
  await nextTick()
}
