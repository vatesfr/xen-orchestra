import PluginMoreActions from '@/modules/plugin/components/actions/PluginMoreActions.vue'
import { createPlugin } from '@/test/create-plugin.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { pluginActionsMock, mockXoPluginActions } from '@/test/mock-xo-plugin-actions.ts'
import VtsActionItems from '@core/components/menu/VtsActionItems.vue'
import { mount } from '@vue/test-utils'
import { toValue } from 'vue'

mockXoPluginActions()

beforeEach(() => {
  pluginActionsMock.reset()
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

  expect(toValue(pluginActionsMock.useXoPluginActions.mock.calls[0][0])).toEqual(plugin)
})

it('offers the secondary actions only, the main ones being buttons', () => {
  const actions = pluginActionsMock.setActions()

  expect(mountMoreActions().getComponent(VtsActionItems).props('actions')).toEqual(actions.moreActions.value)
})
