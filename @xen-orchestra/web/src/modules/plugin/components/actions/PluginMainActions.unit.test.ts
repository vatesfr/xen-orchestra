import PluginMainActions from '@/modules/plugin/components/actions/PluginMainActions.vue'
import { createPlugin } from '@/test/create-plugin.ts'
import { findTooltipContent } from '@/test/find-tooltip-content.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { pluginActionsMock, mockXoPluginActions } from '@/test/mock-xo-plugin-actions.ts'
import { resetStubs } from '@/test/reset-stubs.ts'
import type { LeafActionItem } from '@core/components/menu/VtsActionsMenu.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { mount } from '@vue/test-utils'

const changeState = vi.fn()
const configure = vi.fn()

mockXoPluginActions()

beforeEach(() => {
  pluginActionsMock.reset()
  resetStubs(changeState, configure)

  mockActions()
})

function mockActions(loadOverrides: Partial<LeafActionItem> = {}) {
  pluginActionsMock.setActions({
    loadAction: { onClick: changeState, ...loadOverrides },
    configureAction: { onClick: configure },
  })
}

function mountButtons() {
  return mount(PluginMainActions, {
    props: { plugin: createPlugin() },
    global: createGlobalTestConfig(),
  }).findAllComponents(UiButton)
}

it('offers to configure the plugin as main action, then to load it', () => {
  const buttons = mountButtons().map(button => ({
    label: button.text(),
    icon: button.props('leftIcon'),
    variant: button.props('variant'),
  }))

  expect(buttons).toEqual([
    { label: 'Configure', icon: 'action:edit', variant: 'primary' },
    { label: 'Load', icon: 'action:connect', variant: 'tertiary' },
  ])
})

it('runs the action of the clicked button', async () => {
  const [configureButton, loadButton] = mountButtons()

  await configureButton.trigger('click')
  await loadButton.trigger('click')

  expect(configure).toHaveBeenCalledOnce()
  expect(changeState).toHaveBeenCalledOnce()
})

it('disables the button, with the reason as tooltip, when its action cannot run', async () => {
  mockActions({ disabled: true, hint: 'Plugin already loaded' })
  const [, loadButton] = mountButtons()

  expect(loadButton.props('disabled')).toBe(true)
  expect(await findTooltipContent(loadButton.element)).toBe('Plugin already loaded')
})

it('has no tooltip when the action can run', async () => {
  const [, loadButton] = mountButtons()

  expect(await findTooltipContent(loadButton.element)).toBe(false)
})

it('shows the button as busy while its action runs', () => {
  mockActions({ busy: true })
  const [, loadButton] = mountButtons()

  expect(loadButton.props('busy')).toBe(true)
})
