import V2vVmActions from '@/modules/v2v/components/panel/V2vVmActions.vue'
import { createActionItem } from '@/test/create-action-item.ts'
import { findTooltipContent } from '@/test/find-tooltip-content.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import type { LeafActionItem } from '@core/components/menu/VtsActionsMenu.vue'
import VtsActionsMenu from '@core/components/menu/VtsActionsMenu.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { mount } from '@vue/test-utils'

const MORE_ACTIONS = [createActionItem({ label: 'Remove from list', accent: 'danger' })]

function mountActions(mainAction: Partial<LeafActionItem> | null = {}) {
  return mount(V2vVmActions, {
    props: {
      mainAction: mainAction === null ? undefined : createActionItem({ label: 'Edit settings', ...mainAction }),
      moreActions: MORE_ACTIONS,
    },
    global: createGlobalTestConfig(),
  })
}

function getMainButton(wrapper: ReturnType<typeof mountActions>) {
  return wrapper.getComponent(UiButton)
}

it('offers the main action as a button', () => {
  const button = getMainButton(mountActions({ icon: 'action:edit' }))

  expect([button.text(), button.props('leftIcon'), button.props('variant')]).toEqual([
    'Edit settings',
    'action:edit',
    'primary',
  ])
})

it('runs the main action on click', async () => {
  const onClick = vi.fn()

  await getMainButton(mountActions({ onClick })).trigger('click')

  expect(onClick).toHaveBeenCalledOnce()
})

it('disables the main action, with the reason as tooltip, when it cannot run', async () => {
  const button = getMainButton(mountActions({ disabled: true, hint: 'Locked since the first sync' }))

  expect(button.props('disabled')).toBe(true)
  expect(await findTooltipContent(button.element)).toBe('Locked since the first sync')
})

it('has no tooltip when the main action can run', async () => {
  expect(await findTooltipContent(getMainButton(mountActions()).element)).toBe(false)
})

it('shows the main action busy while it runs', () => {
  expect(getMainButton(mountActions({ busy: true })).props('busy')).toBe(true)
})

it('offers the other actions in its menu', () => {
  expect(mountActions().getComponent(VtsActionsMenu).props('actions')).toEqual(MORE_ACTIONS)
})

it('has no button without a main action', () => {
  expect(mountActions(null).findComponent(UiButton).exists()).toBe(false)
})
