import { useMenuPopup } from '@core/composables/menu-popup.composable.ts'
import { useOverlayStore } from '@core/packages/overlay/use-overlay-store.ts'
import { press } from '@core-test/keyboard.ts'
import { mountWithSetupResult } from '@core-test/mount-with-setup.ts'
import { h, nextTick, ref, useTemplateRef } from 'vue'

type PopupOptions = Partial<Pick<Parameters<typeof useMenuPopup>[1], 'closesOnClickOutside' | 'hasOpenSubmenu'>>

async function mountOpenPopup(options: PopupOptions = {}) {
  const onClosed = vi.fn()
  const isOpen = ref(false)

  const { wrapper, result: popup } = mountWithSetupResult(
    () => {
      const anchor = useTemplateRef<HTMLElement>('anchor')

      return {
        result: useMenuPopup(useTemplateRef<HTMLElement>('menu'), {
          isOpen,
          anchor: () => anchor.value ?? undefined,
          placement: 'right-start',
          closesOnClickOutside: true,
          hasOpenSubmenu: false,
          onClosed,
          ...options,
        }),
        render: () =>
          h('div', [
            h('button', { ref: 'anchor', class: 'anchor' }, 'Actions'),
            h('button', { class: 'outside' }, 'Outside'),
            isOpen.value ? h('ul', { ref: 'menu', class: 'menu-list' }, [h('li', [h('button', 'Item')])]) : null,
          ]),
      }
    },
    { attachTo: document.body }
  )

  isOpen.value = true
  await nextTick()

  return { wrapper, onClosed, isOpen, popup }
}

function registerModal() {
  useOverlayStore().register({
    key: Symbol('modal'),
    component: { render: () => null },
    props: {},
    status: 'idle',
    lastTrigger: undefined,
    returnFocusTarget: null,
    abort: () => {},
  })
}

describe('useMenuPopup', () => {
  it('places the menu against its anchor and exposes the side it ends up on', async () => {
    const { popup } = await mountOpenPopup()

    expect(popup.placementSide.value).toBe('right')
  })

  it('closes on Escape and gives the focus back to its anchor', async () => {
    const { wrapper, onClosed, isOpen } = await mountOpenPopup()

    const event = press('Escape', { target: window })
    await nextTick()

    expect(isOpen.value).toBe(false)
    expect(event.defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(wrapper.get('.anchor').element)
    expect(onClosed).toHaveBeenCalled()
  })

  it('leaves Escape to its open submenu', async () => {
    const { isOpen } = await mountOpenPopup({ hasOpenSubmenu: true })

    press('Escape', { target: window })
    await nextTick()

    expect(isOpen.value).toBe(true)
  })

  it('leaves Escape to a modal opened after it', async () => {
    const { isOpen } = await mountOpenPopup()

    registerModal()

    const event = press('Escape', { target: window })
    await nextTick()

    expect(isOpen.value).toBe(true)
    expect(event.defaultPrevented).toBe(false)
  })

  it('gives the focus back to its anchor when it closes with the focus inside', async () => {
    const { wrapper, popup } = await mountOpenPopup()

    wrapper.get<HTMLElement>('.menu-list button').element.focus()
    popup.close()
    await nextTick()

    expect(document.activeElement).toBe(wrapper.get('.anchor').element)
  })

  it.each([
    { closesOnClickOutside: true, expected: false },
    { closesOnClickOutside: false, expected: true },
  ])(
    'stays open after a click outside: $expected, when closesOnClickOutside is $closesOnClickOutside',
    async ({ closesOnClickOutside, expected }) => {
      const { wrapper, isOpen } = await mountOpenPopup({ closesOnClickOutside })

      const outside = wrapper.get('.outside')

      await outside.trigger('pointerdown')
      await outside.trigger('click')

      expect(isOpen.value).toBe(expected)
    }
  )
})
