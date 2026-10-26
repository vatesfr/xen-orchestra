import PluginAutoloadButton from '@/modules/plugin/components/actions/autoload/PluginAutoloadButton.vue'
import type { useXoPluginActions } from '@/modules/plugin/composables/use-xo-plugin-actions.composable.ts'
import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import { createActionItem } from '@/test/create-action-item.ts'
import { createPlugin } from '@/test/create-plugin.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import type { LeafActionItem } from '@core/components/menu/VtsActionsMenu.vue'
import MenuItem from '@core/components/menu/MenuItem.vue'
import MenuTrigger from '@core/components/menu/MenuTrigger.vue'
import { mount } from '@vue/test-utils'
import { ref, toValue } from 'vue'

const { useActions, updateAutoload } = vi.hoisted(() => ({
  useActions: vi.fn(),
  updateAutoload: vi.fn(),
}))

// The composable runs the plugin jobs, which call the REST API
vi.mock(import('@/modules/plugin/composables/use-xo-plugin-actions.composable.ts'), () => ({
  useXoPluginActions: useActions as unknown as typeof useXoPluginActions,
}))

beforeEach(() => {
  useActions.mockReset()
  updateAutoload.mockReset()

  mockAutoloadAction()
})

function mockAutoloadAction(overrides: Partial<LeafActionItem> = {}) {
  useActions.mockReturnValue({
    autoloadAction: ref(
      createActionItem({
        label: 'Disable load at startup',
        icon: 'action:change-state',
        onClick: updateAutoload,
        ...overrides,
      })
    ),
  })
}

function mountButton(plugin: FrontXoPlugin = createPlugin()) {
  return mount(PluginAutoloadButton, {
    props: { plugin },
    global: createGlobalTestConfig(),
  })
}

it('offers the autoload action of the plugin', () => {
  const menuItem = mountButton().getComponent(MenuItem)

  expect(menuItem.text()).toBe('Disable load at startup')
  expect(menuItem.props('icon')).toBe('action:change-state')
})

it('builds the actions of the plugin', () => {
  const plugin = createPlugin()
  mountButton(plugin)

  expect(toValue(useActions.mock.lastCall?.[0])).toEqual(plugin)
})

it('runs the action when clicking the menu item', async () => {
  await mountButton().getComponent(MenuTrigger).trigger('click')

  expect(updateAutoload).toHaveBeenCalledOnce()
})

it('disables the menu item, with the reason, when the action cannot run', () => {
  mockAutoloadAction({ disabled: true, hint: 'Plugin is missing' })
  const menuItem = mountButton().getComponent(MenuItem)

  expect(menuItem.props('disabled')).toBe(true)
  expect(menuItem.get('.em-dash-prefix').text()).toBe('Plugin is missing')
})

it('shows no reason when the action can run', () => {
  expect(mountButton().find('.em-dash-prefix').exists()).toBe(false)
})

it('shows the menu item as busy while the action runs', () => {
  mockAutoloadAction({ busy: true })

  expect(mountButton().getComponent(MenuItem).props('busy')).toBe(true)
})
