import MenuItem from '@core/components/menu/MenuItem.vue'
import type { MobileMenuController } from '@core/components/menu/VtsMobileMenu.vue'
import { useMenuLevel } from '@core/composables/menu-level.composable.ts'
import {
  IK_CLOSE_MENU,
  IK_DISABLED,
  IK_MENU_HORIZONTAL,
  IK_MENU_LEVEL,
  IK_MOBILE_MENU,
} from '@core/utils/injection-keys.util.ts'
import { createGlobalTestConfig } from '@core-test/create-global-test-config.ts'
import { findIconNames } from '@core-test/find-icon-names.ts'
import { getFocusedLabel, press } from '@core-test/keyboard.ts'
import { clickMenuItem, getMenuTrigger } from '@core-test/menu.ts'
import { mountWithSetupResult } from '@core-test/mount-with-setup.ts'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { computed, h, provide, type VNodeChild } from 'vue'

type MenuItemCase = {
  onClick?: () => unknown
  disabled?: boolean
  busy?: boolean
  submenu?: boolean
  horizontal?: boolean
  parentDisabled?: boolean
  mobileMenu?: MobileMenuController
}

const closeMenu = vi.fn()

beforeEach(() => {
  closeMenu.mockReset()
})

function mountMenuItem({
  submenu = false,
  horizontal = false,
  parentDisabled = false,
  mobileMenu,
  ...props
}: MenuItemCase = {}) {
  const { wrapper, result: level } = mountWithSetupResult(() => {
    const level = useMenuLevel({ isPopup: false, horizontal })

    provide(IK_MENU_LEVEL, level)
    provide(
      IK_MENU_HORIZONTAL,
      computed(() => horizontal)
    )
    provide(IK_CLOSE_MENU, closeMenu)

    if (parentDisabled) {
      provide(
        IK_DISABLED,
        computed(() => true)
      )
    }

    if (mobileMenu !== undefined) {
      provide(IK_MOBILE_MENU, mobileMenu)
    }

    return {
      result: level,
      render: () =>
        h(
          MenuItem,
          { accent: 'brand', icon: 'action:add', ...props },
          {
            default: () => 'Item',
            ...(submenu && { submenu: () => h(MenuItem, { accent: 'brand' }, () => 'Submenu') }),
          }
        ),
    }
  })

  return { wrapper, level, trigger: getMenuTrigger(wrapper) }
}

// A MenuItem with no menu around it: no menu level and no close function provided
function mountStandaloneMenuItem({ submenu = false, ...props }: Pick<MenuItemCase, 'onClick' | 'submenu'> = {}) {
  return mount(MenuItem, {
    props: { accent: 'brand', ...props },
    slots: { default: () => 'Item', ...(submenu && { submenu: () => 'Submenu' }) },
    global: createGlobalTestConfig(),
  })
}

// An action still running until the test settles it
function deferAction() {
  const settle: { resolve?: () => void; reject?: (error: Error) => void } = {}
  const onClick = vi.fn(
    () =>
      new Promise<void>((resolve, reject) => {
        settle.resolve = resolve
        settle.reject = reject
      })
  )

  return { onClick, settle }
}

function spyOnErrorHandler(wrapper: VueWrapper) {
  const errorHandler = vi.fn()
  wrapper.vm.$.appContext.config.errorHandler = errorHandler

  return errorHandler
}

function renderSlot(slot: () => VNodeChild) {
  return mount(() => slot()).text()
}

it('renders its label in a trigger with its accent and icon', () => {
  const item = mountMenuItem()

  expect(item.trigger.text()).toBe('Item')
  expect(findIconNames(item.trigger)).toEqual(['action:add'])
  expect(item.trigger.props()).toMatchObject({ accent: 'brand', icon: 'action:add', disabled: false, busy: false })
})

it.each([
  { label: 'by its prop', disabled: true },
  { label: 'by its parent', parentDisabled: true },
])('is disabled $label', item => {
  expect(mountMenuItem(item).trigger.props('disabled')).toBe(true)
})

it('shows as busy and active when it is busy', () => {
  expect(mountMenuItem({ busy: true }).trigger.props()).toMatchObject({ busy: true, active: true })
})

it('runs its action, then closes the menu', async () => {
  const onClick = vi.fn()

  await clickMenuItem(mountMenuItem({ onClick }).wrapper)
  await flushPromises()

  expect(onClick).toHaveBeenCalledOnce()
  expect(closeMenu).toHaveBeenCalledOnce()
})

it('closes the menu when it has no action', async () => {
  await clickMenuItem(mountMenuItem().wrapper)
  await flushPromises()

  expect(closeMenu).toHaveBeenCalledOnce()
})

it.each([
  { label: 'disabled by its prop', disabled: true },
  { label: 'disabled by its parent', parentDisabled: true },
  { label: 'busy', busy: true },
])('neither runs its action nor closes the menu when $label', async item => {
  const onClick = vi.fn()

  await clickMenuItem(mountMenuItem({ ...item, onClick }).wrapper)
  await flushPromises()

  expect(onClick).not.toHaveBeenCalled()
  expect(closeMenu).not.toHaveBeenCalled()
})

it('is busy while its action runs, and ignores another click meanwhile', async () => {
  const { onClick, settle } = deferAction()
  const { wrapper, trigger } = mountMenuItem({ onClick })

  await clickMenuItem(wrapper)
  await clickMenuItem(wrapper)

  expect(trigger.props()).toMatchObject({ busy: true, active: true })
  expect(closeMenu).not.toHaveBeenCalled()

  settle.resolve?.()
  await flushPromises()

  expect(onClick).toHaveBeenCalledOnce()
  expect(trigger.props('busy')).toBe(false)
  expect(closeMenu).toHaveBeenCalledOnce()
})

it('runs its action outside of a menu, with no menu to close', async () => {
  const onClick = vi.fn()
  const wrapper = mountStandaloneMenuItem({ onClick })
  const errorHandler = spyOnErrorHandler(wrapper)

  await clickMenuItem(wrapper)
  await flushPromises()

  expect(onClick).toHaveBeenCalledOnce()
  expect(errorHandler).not.toHaveBeenCalled()
})

it('is no longer busy, and keeps the menu open, when its action fails', async () => {
  const { onClick, settle } = deferAction()
  const { wrapper, trigger } = mountMenuItem({ onClick })
  const errorHandler = spyOnErrorHandler(wrapper)

  await clickMenuItem(wrapper)
  settle.reject?.(new Error('Failed'))
  await flushPromises()

  expect(trigger.props('busy')).toBe(false)
  expect(closeMenu).not.toHaveBeenCalled()
  expect(errorHandler).toHaveBeenCalledOnce()
})

describe('submenu in a mobile menu', () => {
  it('opens the submenu in the mobile menu, titled by its label, without closing the menu', async () => {
    const openSubmenu = vi.fn()
    const { wrapper } = mountMenuItem({ submenu: true, mobileMenu: { openSubmenu } })

    await clickMenuItem(wrapper)

    const [{ title, content }] = openSubmenu.mock.lastCall!

    expect([renderSlot(title), renderSlot(content)]).toEqual(['Item', 'Submenu'])
    expect(closeMenu).not.toHaveBeenCalled()
  })

  it('shows the submenu arrow', () => {
    expect(findIconNames(mountMenuItem({ submenu: true, mobileMenu: { openSubmenu: vi.fn() } }).trigger)).toEqual([
      'action:add',
      'fa:angle-right',
    ])
  })
})

describe('submenu', () => {
  function isSubmenuOpen({ level, trigger }: ReturnType<typeof mountMenuItem>) {
    return level.openedItemId.value !== undefined && trigger.props('selected') === true
  }

  it('opens its submenu on click, and selects its trigger', async () => {
    const item = mountMenuItem({ submenu: true })

    await clickMenuItem(item.wrapper)

    expect(isSubmenuOpen(item)).toBe(true)
    expect(document.body.querySelector('.menu-list')?.textContent).toBe('Submenu')
  })

  it('focuses the first item of its submenu once open', async () => {
    const item = mountMenuItem({ submenu: true })

    await clickMenuItem(item.wrapper)
    await flushPromises()

    expect(getFocusedLabel()).toBe('Submenu')
  })

  it('closes its submenu on Escape', async () => {
    const item = mountMenuItem({ submenu: true })

    await clickMenuItem(item.wrapper)
    await flushPromises()
    press('Escape')
    await flushPromises()

    expect(isSubmenuOpen(item)).toBe(false)
  })

  it('opens its submenu on a menu level of its own outside of a menu', async () => {
    const wrapper = mountStandaloneMenuItem({ submenu: true })

    await clickMenuItem(wrapper)

    expect(getMenuTrigger(wrapper).props('selected')).toBe(true)
  })

  it('does not open its submenu when disabled', async () => {
    const item = mountMenuItem({ submenu: true, disabled: true })

    await clickMenuItem(item.wrapper)

    expect(isSubmenuOpen(item)).toBe(false)
  })

  it.each([
    { direction: 'vertical', horizontal: false, icon: 'fa:angle-right' },
    { direction: 'horizontal', horizontal: true, icon: 'fa:angle-down' },
  ])('points its arrow toward its submenu in a $direction menu', ({ horizontal, icon }) => {
    expect(findIconNames(mountMenuItem({ submenu: true, horizontal }).trigger)).toEqual(['action:add', icon])
  })

  it.each([
    { direction: 'vertical', horizontal: false, key: 'ArrowRight', opens: true },
    { direction: 'vertical', horizontal: false, key: 'ArrowDown', opens: false },
    { direction: 'horizontal', horizontal: true, key: 'ArrowDown', opens: true },
    { direction: 'horizontal', horizontal: true, key: 'ArrowRight', opens: false },
  ])('opens its submenu on $key in a $direction menu: $opens', async ({ horizontal, key, opens }) => {
    const item = mountMenuItem({ submenu: true, horizontal })
    const event = press(key, { target: item.trigger.element })
    await flushPromises()

    expect(isSubmenuOpen(item)).toBe(opens)
    expect(event.defaultPrevented).toBe(opens)
  })
})

describe('pointer', () => {
  function spyOnLevel(level: ReturnType<typeof mountMenuItem>['level']) {
    return {
      hoverItem: vi.spyOn(level, 'hoverItem').mockImplementation(() => {}),
      leaveItem: vi.spyOn(level, 'leaveItem').mockImplementation(() => {}),
    }
  }

  it.each([
    { label: 'without submenu', item: {}, hasSubmenu: false },
    { label: 'with a submenu', item: { submenu: true }, hasSubmenu: true },
    { label: 'with a disabled submenu', item: { submenu: true, disabled: true }, hasSubmenu: false },
    {
      label: 'with a submenu in a mobile menu',
      item: { submenu: true, mobileMenu: { openSubmenu: vi.fn() } },
      hasSubmenu: false,
    },
  ])('reports the mouse moving over and leaving the item, $label', async ({ item, hasSubmenu }) => {
    const { level, trigger } = mountMenuItem(item)
    const { hoverItem, leaveItem } = spyOnLevel(level)

    await trigger.trigger('pointermove', { pointerType: 'mouse' })
    await trigger.trigger('pointerleave', { pointerType: 'mouse' })

    const [[hovered]] = hoverItem.mock.calls

    expect(hovered.hasSubmenu).toBe(hasSubmenu)
    expect(leaveItem.mock.calls.map(([itemId]) => itemId)).toEqual([hovered.itemId])
  })

  it('ignores a pointer other than a mouse', async () => {
    const { level, trigger } = mountMenuItem({ submenu: true })
    const { hoverItem, leaveItem } = spyOnLevel(level)

    await trigger.trigger('pointermove', { pointerType: 'touch' })
    await trigger.trigger('pointerleave', { pointerType: 'touch' })

    expect(hoverItem).not.toHaveBeenCalled()
    expect(leaveItem).not.toHaveBeenCalled()
  })
})
