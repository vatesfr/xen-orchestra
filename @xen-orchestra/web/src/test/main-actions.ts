import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import UiDropdownButton from '@core/components/ui/dropdown-button/UiDropdownButton.vue'
import { IK_PANEL_ACTIONS_COMPACT } from '@core/utils/injection-keys.util.ts'
import { findButton } from '@core-test/get-button.ts'
import { findMoreActionLabels } from '@core-test/menu.ts'
import { mount } from '@vue/test-utils'
import { type Component, computed } from 'vue'

/**
 * Registers the tests the main actions of every object side panel share: the state change dropdown beside the more
 * actions button when the actions fit, then moved into the more actions menu when the panel is too narrow. `props`
 * mounts the component on its object; `otherMenuItem`, when given, is a label the menu holds when the actions fit.
 */
export function itCompactsMainActions(
  component: Component,
  { props, otherMenuItem }: { props: () => Record<string, unknown>; otherMenuItem?: string }
) {
  function mountActions({ isPanelCompact = false } = {}) {
    return mount(component, {
      props: props(),
      global: {
        ...createGlobalTestConfig(),
        provide: { [IK_PANEL_ACTIONS_COMPACT as symbol]: computed(() => isPanelCompact) },
      },
    })
  }

  describe('when the actions fit', () => {
    it('shows the state-change dropdown', () => {
      const wrapper = mountActions()

      expect(wrapper.getComponent(UiDropdownButton).text()).toBe(t('action:change-state'))
    })

    it('keeps the state change out of the more actions menu', async () => {
      const wrapper = mountActions()

      const labels = await findMoreActionLabels(wrapper)

      if (otherMenuItem !== undefined) {
        expect(labels).toContain(otherMenuItem)
      }

      expect(labels).not.toContain(t('action:change-state'))
    })
  })

  describe('when the panel is too narrow', () => {
    it('only shows the more actions button', () => {
      const wrapper = mountActions({ isPanelCompact: true })

      expect(wrapper.findComponent(UiDropdownButton).exists()).toBe(false)
      expect(findButton(wrapper, t('more-actions'))).toBeDefined()
    })

    it('moves the state change into the more actions menu', async () => {
      const wrapper = mountActions({ isPanelCompact: true })

      expect(await findMoreActionLabels(wrapper)).toContain(t('action:change-state'))
    })
  })
}
