import PluginMainActions from '@/modules/plugin/components/actions/PluginMainActions.vue'
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

const { useActions, changeState, configure } = vi.hoisted(() => ({
  useActions: vi.fn(),
  changeState: vi.fn(),
  configure: vi.fn(),
}))

// The composable runs the plugin jobs, which call the REST API
vi.mock(import('@/modules/plugin/composables/use-xo-plugin-actions.composable.ts'), () => ({
  useXoPluginActions: useActions as unknown as typeof useXoPluginActions,
}))

beforeEach(() => {
  useActions.mockReset()
  changeState.mockReset()
  configure.mockReset()

  mockActions()
})

function mockActions(loadOverrides: Partial<LeafActionItem> = {}) {
  useActions.mockReturnValue({
    loadAction: ref(
      createActionItem({ label: 'Load', icon: 'action:connect', onClick: changeState, ...loadOverrides })
    ),
    configureAction: ref(createActionItem({ label: 'Configure', icon: 'action:edit', onClick: configure })),
  })
}

function mountButtons(plugin: FrontXoPlugin = createPlugin()) {
  return mount(PluginMainActions, {
    props: { plugin },
    global: createGlobalTestConfig(),
  }).findAllComponents(UiButton)
}

it('offers to load the plugin, then to configure it as main action', () => {
  const buttons = mountButtons().map(button => ({
    label: button.text(),
    icon: button.props('leftIcon'),
    variant: button.props('variant'),
  }))

  expect(buttons).toEqual([
    { label: 'Load', icon: 'action:connect', variant: 'tertiary' },
    { label: 'Configure', icon: 'action:edit', variant: 'primary' },
  ])
})

it('builds the actions of the plugin', () => {
  const plugin = createPlugin()
  mountButtons(plugin)

  expect(toValue(useActions.mock.lastCall?.[0])).toEqual(plugin)
})

it('runs the action of the clicked button', async () => {
  const [loadButton, configureButton] = mountButtons()

  await loadButton.trigger('click')
  await configureButton.trigger('click')

  expect(changeState).toHaveBeenCalledOnce()
  expect(configure).toHaveBeenCalledOnce()
})

it('disables the button, with the reason as tooltip, when its action cannot run', async () => {
  mockActions({ disabled: true, hint: 'Plugin already loaded' })
  const [loadButton] = mountButtons()

  expect(loadButton.props('disabled')).toBe(true)
  expect(await findTooltipContent(loadButton.element)).toBe('Plugin already loaded')
})

it('has no tooltip when the action can run', async () => {
  const [loadButton] = mountButtons()

  expect(await findTooltipContent(loadButton.element)).toBe(false)
})

it('shows the button as busy while its action runs', () => {
  mockActions({ busy: true })
  const [loadButton] = mountButtons()

  expect(loadButton.props('busy')).toBe(true)
})
