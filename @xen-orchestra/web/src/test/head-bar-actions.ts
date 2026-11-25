import { collapseOnOverflowMock } from '@/test/mock-collapse-on-overflow.ts'
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

/**
 * Registers the test of a header whose quick actions follow the power state of its object: it measures them again,
 * through the mocked `useCollapseOnOverflow` (`mock-collapse-on-overflow.ts`, reset by the test file before each
 * test). `mountActions` mounts it on a running object, `haltedProps` are the props of that object once halted.
 */
export function itMeasuresAgainOnPowerStateChange(
  mountActions: () => VueWrapper,
  haltedProps: () => Record<string, unknown>
) {
  it('measures the header again when the quick actions change with the power state', async () => {
    const wrapper = mountActions()

    await wrapper.setProps(haltedProps())

    expect(collapseOnOverflowMock.resetCollapsedCount).toHaveBeenCalledOnce()
  })
}
