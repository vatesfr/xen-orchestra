import { useMenuPopup } from '@core/composables/menu-popup.composable.ts'
import { useOverlayStore } from '@core/packages/overlay/use-overlay-store.ts'
import { createGlobalTestConfig } from '@core-test/create-global-test-config.ts'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref, useTemplateRef } from 'vue'

type PopupOptions = Partial<Pick<Parameters<typeof useMenuPopup>[1], 'closesOnClickOutside' | 'hasOpenSubmenu'>>

async function mountOpenPopup(options: PopupOptions = {}) {
  const onClosed = vi.fn()

  const wrapper = mount(
    defineComponent({
      setup: () => {
        const isOpen = ref(false)
        const anchor = useTemplateRef<HTMLElement>('anchor')

        const popup = useMenuPopup(useTemplateRef<HTMLElement>('menu'), {
          isOpen,
          anchor: () => anchor.value ?? undefined,
          placement: 'right-start',
          closesOnClickOutside: true,
          hasOpenSubmenu: false,
          onClosed,
          ...options,
        })

        return { isOpen, ...popup }
      },
      render() {
        return h('div', [
          h('button', { ref: 'anchor', class: 'anchor' }, 'Actions'),
          h('button', { class: 'outside' }, 'Outside'),
          this.isOpen ? h('ul', { ref: 'menu', class: 'menu-list' }, [h('li', [h('button', 'Item')])]) : null,
        ])
      },
    }),
    { attachTo: document.body, global: createGlobalTestConfig() }
  )

  wrapper.vm.isOpen = true
  await nextTick()

  return { wrapper, onClosed }
}

function pressEscape() {
  const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })

  window.dispatchEvent(event)

  return event
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
    const { wrapper } = await mountOpenPopup()

    expect(wrapper.vm.placementSide).toBe('right')
  })

  it('closes on Escape and gives the focus back to its anchor', async () => {
    const { wrapper, onClosed } = await mountOpenPopup()

    const event = pressEscape()
    await nextTick()

    expect(wrapper.vm.isOpen).toBe(false)
    expect(event.defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(wrapper.get('.anchor').element)
    expect(onClosed).toHaveBeenCalled()
  })

  it('leaves Escape to its open submenu', async () => {
    const { wrapper } = await mountOpenPopup({ hasOpenSubmenu: true })

    pressEscape()
    await nextTick()

    expect(wrapper.vm.isOpen).toBe(true)
  })

  it('leaves Escape to a modal opened after it', async () => {
    const { wrapper } = await mountOpenPopup()

    registerModal()

    const event = pressEscape()
    await nextTick()

    expect(wrapper.vm.isOpen).toBe(true)
    expect(event.defaultPrevented).toBe(false)
  })

  it('gives the focus back to its anchor when it closes with the focus inside', async () => {
    const { wrapper } = await mountOpenPopup()

    wrapper.get<HTMLElement>('.menu-list button').element.focus()
    wrapper.vm.close()
    await nextTick()

    expect(document.activeElement).toBe(wrapper.get('.anchor').element)
  })

  it.each([
    { closesOnClickOutside: true, expected: false },
    { closesOnClickOutside: false, expected: true },
  ])(
    'stays open after a click outside: $expected, when closesOnClickOutside is $closesOnClickOutside',
    async ({ closesOnClickOutside, expected }) => {
      const { wrapper } = await mountOpenPopup({ closesOnClickOutside })

      const outside = wrapper.get('.outside')

      await outside.trigger('pointerdown')
      await outside.trigger('click')

      expect(wrapper.vm.isOpen).toBe(expected)
    }
  )
})
