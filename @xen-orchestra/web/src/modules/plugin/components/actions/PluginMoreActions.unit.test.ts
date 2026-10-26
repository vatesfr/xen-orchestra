import PluginMoreActions from '@/modules/plugin/components/actions/PluginMoreActions.vue'
import type { useXoPluginActions } from '@/modules/plugin/composables/use-xo-plugin-actions.composable.ts'
import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import { createActionItem } from '@/test/create-action-item.ts'
import { createPlugin } from '@/test/create-plugin.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { mount } from '@vue/test-utils'
import { ref, toValue } from 'vue'

const { useActions } = vi.hoisted(() => ({
  useActions: vi.fn(),
}))

// The composable runs the plugin jobs, which call the REST API
vi.mock(import('@/modules/plugin/composables/use-xo-plugin-actions.composable.ts'), () => ({
  useXoPluginActions: useActions as unknown as typeof useXoPluginActions,
}))

beforeEach(() => {
  useActions.mockReset()

  useActions.mockReturnValue({
    moreActions: ref([
      createActionItem({ label: 'Disable load at startup' }),
      createActionItem({ label: 'Test plugin' }),
      createActionItem({ label: 'Delete configuration', separator: true }),
    ]),
  })
})

function mountMoreActions(plugin: FrontXoPlugin = createPlugin()) {
  return mount(PluginMoreActions, {
    props: { plugin },
    global: createGlobalTestConfig(),
  })
}

it('offers the secondary actions of the plugin', () => {
  const labels = mountMoreActions()
    .findAllComponents(MenuItem)
    .map(menuItem => menuItem.text())

  expect(labels).toEqual(['Disable load at startup', 'Test plugin', 'Delete configuration'])
})

it('builds the actions of the plugin', () => {
  const plugin = createPlugin()
  mountMoreActions(plugin)

  expect(toValue(useActions.mock.lastCall?.[0])).toEqual(plugin)
})
