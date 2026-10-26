import PluginsTable from '@/modules/plugin/components/list/PluginsTable.vue'
import type { useXoPluginActions } from '@/modules/plugin/composables/use-xo-plugin-actions.composable.ts'
import { createActionItem } from '@/test/create-action-item.ts'
import { createPlugin } from '@/test/create-plugin.ts'
import { createTestRouter } from '@/test/create-test-router.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import VtsActionCell from '@core/components/table/cells/VtsActionCell.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'

const { useActions } = vi.hoisted(() => ({
  useActions: vi.fn(),
}))

// The composable runs the plugin jobs, which call the REST API
vi.mock(import('@/modules/plugin/composables/use-xo-plugin-actions.composable.ts'), () => ({
  useXoPluginActions: useActions as unknown as typeof useXoPluginActions,
}))

const loadAction = createActionItem({ label: 'Load' })

const autoloadAction = createActionItem({ label: 'Enable load at startup' })

beforeEach(() => {
  useActions.mockReset()

  useActions.mockReturnValue({ loadAction: ref(loadAction), autoloadAction: ref(autoloadAction) })
})

function mountTable(router = createTestRouter()) {
  return mount(PluginsTable, {
    props: { plugins: [createPlugin()], busy: false, error: false },
    global: createGlobalTestConfig({ router }),
  })
}

it('offers the load and autoload actions of the plugin in its row', () => {
  const actionCell = mountTable().getComponent(VtsActionCell)

  expect(actionCell.props('actions')).toEqual([loadAction, autoloadAction])
})

it('selects the plugin of the row to show it in the side panel', async () => {
  const router = createTestRouter()
  const actionCell = mountTable(router).getComponent(VtsActionCell)

  await actionCell.getComponent(UiButtonIcon).trigger('click')

  await vi.waitFor(() => expect(router.currentRoute.value.query.id).toBe('transport-email'))
})
