import PluginsTable from '@/modules/plugin/components/list/PluginsTable.vue'
import { createPlugin } from '@/test/create-plugin.ts'
import { createTestRouter } from '@/test/create-test-router.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { pluginActionsMock, mockXoPluginActions } from '@/test/mock-xo-plugin-actions.ts'
import VtsActionCell from '@core/components/table/cells/VtsActionCell.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import { mount } from '@vue/test-utils'

mockXoPluginActions()

beforeEach(() => {
  pluginActionsMock.reset()
})

function mountTable(router = createTestRouter()) {
  return mount(PluginsTable, {
    props: { plugins: [createPlugin()], busy: false, error: false },
    global: createGlobalTestConfig({ router }),
  })
}

it('offers to load and configure the plugin in its row, then the other actions', () => {
  const { loadAction, configureAction, moreActions } = pluginActionsMock.setActions()
  const actionCell = mountTable().getComponent(VtsActionCell)

  expect(actionCell.props('actions')).toEqual([configureAction.value, loadAction.value, ...moreActions.value])
})

it('selects the plugin of the row to show it in the side panel', async () => {
  const router = createTestRouter()
  const actionCell = mountTable(router).getComponent(VtsActionCell)

  await actionCell.getComponent(UiButtonIcon).trigger('click')

  await vi.waitFor(() => expect(router.currentRoute.value.query.id).toBe('transport-email'))
})
