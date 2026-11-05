import PluginMoreActions from '@/modules/plugin/components/actions/PluginMoreActions.vue'
import type { useXoPluginActions } from '@/modules/plugin/composables/use-xo-plugin-actions.composable.ts'
import { createPluginActions } from '@/test/create-plugin-actions.ts'
import { createPlugin } from '@/test/create-plugin.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import VtsActionItems from '@core/components/menu/VtsActionItems.vue'
import { mount } from '@vue/test-utils'
import { toValue } from 'vue'

const { useActions } = vi.hoisted(() => ({
  useActions: vi.fn(),
}))

// The composable runs the plugin jobs, which call the REST API
vi.mock(import('@/modules/plugin/composables/use-xo-plugin-actions.composable.ts'), () => ({
  useXoPluginActions: useActions as unknown as typeof useXoPluginActions,
}))

beforeEach(() => {
  useActions.mockReset()

  useActions.mockReturnValue(createPluginActions())
})

function mountMoreActions(plugin = createPlugin()) {
  return mount(PluginMoreActions, {
    props: { plugin },
    global: createGlobalTestConfig(),
  })
}

it('runs the actions on its plugin', () => {
  const plugin = createPlugin({ name: 'backup-reports' })

  mountMoreActions(plugin)

  expect(toValue(useActions.mock.calls[0][0])).toEqual(plugin)
})

it('offers the secondary actions only, the main ones being buttons', () => {
  const actions = createPluginActions()
  useActions.mockReturnValue(actions)

  expect(mountMoreActions().getComponent(VtsActionItems).props('actions')).toEqual(actions.moreActions.value)
})
