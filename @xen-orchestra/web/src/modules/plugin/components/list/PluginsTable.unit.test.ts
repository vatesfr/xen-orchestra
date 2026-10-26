import PluginsTable from '@/modules/plugin/components/list/PluginsTable.vue'
import type { useXoPluginActions } from '@/modules/plugin/composables/use-xo-plugin-actions.composable.ts'
import { createPluginActions } from '@/test/create-plugin-actions.ts'
import { createPlugin } from '@/test/create-plugin.ts'
import { createTestRouter } from '@/test/create-test-router.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import VtsActionCell from '@core/components/table/cells/VtsActionCell.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import { mount } from '@vue/test-utils'

const { useActions } = vi.hoisted(() => ({
  useActions: vi.fn(),
}))

// The composable runs the plugin jobs, which call the REST API
vi.mock(import('@/modules/plugin/composables/use-xo-plugin-actions.composable.ts'), () => ({
  useXoPluginActions: useActions as unknown as typeof useXoPluginActions,
}))

const { loadAction, configureAction, moreActions } = createPluginActions()

beforeEach(() => {
  useActions.mockReset()

  useActions.mockReturnValue({ loadAction, configureAction, moreActions })
})

function mountTable(router = createTestRouter()) {
  return mount(PluginsTable, {
    props: { plugins: [createPlugin()], busy: false, error: false },
    global: createGlobalTestConfig({ router }),
  })
}

it('offers to load and configure the plugin in its row, then the other actions', () => {
  const actionCell = mountTable().getComponent(VtsActionCell)

  expect(actionCell.props('actions')).toEqual([configureAction.value, loadAction.value, ...moreActions.value])
})

it('selects the plugin of the row to show it in the side panel', async () => {
  const router = createTestRouter()
  const actionCell = mountTable(router).getComponent(VtsActionCell)

  await actionCell.getComponent(UiButtonIcon).trigger('click')

  await vi.waitFor(() => expect(router.currentRoute.value.query.id).toBe('transport-email'))
})
