import PluginChangeStateButton from '@/modules/plugin/components/actions/change-state/PluginChangeStateButton.vue'
import type { useXoPluginActions } from '@/modules/plugin/composables/use-xo-plugin-actions.composable.ts'
import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import { createActionItem } from '@/test/create-action-item.ts'
import { createPlugin } from '@/test/create-plugin.ts'
import { findTooltipContent } from '@/test/find-tooltip-content.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import type { LeafActionItem } from '@core/components/menu/VtsActionsMenu.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { mount } from '@vue/test-utils'
import { ref, toValue } from 'vue'

const { useActions, changeState } = vi.hoisted(() => ({
  useActions: vi.fn(),
  changeState: vi.fn(),
}))

// The composable runs the plugin jobs, which call the REST API
vi.mock(import('@/modules/plugin/composables/use-xo-plugin-actions.composable.ts'), () => ({
  useXoPluginActions: useActions as unknown as typeof useXoPluginActions,
}))

beforeEach(() => {
  useActions.mockReset()
  changeState.mockReset()

  mockLoadAction()
})

function mockLoadAction(overrides: Partial<LeafActionItem> = {}) {
  useActions.mockReturnValue({
    loadAction: ref(createActionItem({ label: 'Load', icon: 'action:connect', onClick: changeState, ...overrides })),
  })
}

function mountButton(plugin: FrontXoPlugin = createPlugin()) {
  return mount(PluginChangeStateButton, {
    props: { plugin },
    global: createGlobalTestConfig(),
  }).getComponent(UiButton)
}

it('offers the load action of the plugin', () => {
  const button = mountButton()

  expect(button.text()).toBe('Load')
  expect(button.props('leftIcon')).toBe('action:connect')
})

it('builds the actions of the plugin', () => {
  const plugin = createPlugin()
  mountButton(plugin)

  expect(toValue(useActions.mock.lastCall?.[0])).toEqual(plugin)
})

it('runs the action when clicking the button', async () => {
  await mountButton().trigger('click')

  expect(changeState).toHaveBeenCalledOnce()
})

it('disables the button, with the reason as tooltip, when the action cannot run', async () => {
  mockLoadAction({ disabled: true, hint: 'Plugin already loaded' })
  const button = mountButton()

  expect(button.props('disabled')).toBe(true)
  expect(await findTooltipContent(button.element)).toBe('Plugin already loaded')
})

it('has no tooltip when the action can run', async () => {
  expect(await findTooltipContent(mountButton().element)).toBe(false)
})

it('shows the button as busy while the action runs', () => {
  mockLoadAction({ busy: true })

  expect(mountButton().props('busy')).toBe(true)
})
