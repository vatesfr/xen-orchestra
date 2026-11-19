import { useMenuListNavigation } from '@core/composables/menu-list-navigation.composable.ts'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'

async function mountMenuListNavigation({
  isHorizontal = false,
  canCloseWithArrowLeft = false,
  hasTarget = true,
}: {
  isHorizontal?: boolean
  canCloseWithArrowLeft?: boolean
  hasTarget?: boolean
} = {}) {
  const onClose = vi.fn()
  const onLeave = vi.fn()
  const onItemClick = vi.fn()
  const onButtonClick = vi.fn()

  let focusFirstItem = () => {}

  mount(
    defineComponent({
      setup() {
        const menu = ref<HTMLElement>()

        focusFirstItem = useMenuListNavigation({
          target: () => (hasTarget ? menu.value : undefined),
          isHorizontal,
          canCloseWithArrowLeft,
          onClose,
          onLeave,
        }).focusFirstItem

        return () =>
          h('ul', { ref: menu, class: 'menu-list' }, [
            h('li', [h('div', { class: 'menu-trigger', tabindex: -1, onClick: onItemClick }, 'One')]),
            h('li', [
              h('div', { class: 'menu-trigger', tabindex: -1 }, [h('button', { onClick: onButtonClick }, 'Two')]),
            ]),
            h('li', [
              h('div', { class: 'menu-trigger', tabindex: -1 }, 'Three'),
              h('ul', { class: 'menu-list' }, [h('li', [h('div', { class: 'menu-trigger', tabindex: -1 }, 'Nested')])]),
            ]),
          ])
      },
    }),
    { attachTo: document.body }
  )

  await nextTick()

  return { focusFirstItem, onClose, onLeave, onItemClick, onButtonClick }
}

function getItem(label: string) {
  const item = Array.from(document.querySelectorAll<HTMLElement>('.menu-trigger')).find(
    element => element.textContent === label
  )

  if (item === undefined) {
    throw new Error(`No menu item labeled "${label}"`)
  }

  return item
}

function getFocusedLabel() {
  return document.activeElement?.textContent
}

function press(key: string) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })

  document.activeElement?.dispatchEvent(event)

  return event
}

describe('focusFirstItem', () => {
  it('focuses the first item of the menu', async () => {
    const { focusFirstItem } = await mountMenuListNavigation()

    focusFirstItem()

    expect(getFocusedLabel()).toBe('One')
  })
})

describe('keyboard navigation', () => {
  it('moves the focus to the next item with ArrowDown and wraps around after the last one', async () => {
    await mountMenuListNavigation()

    getItem('Two').focus()

    expect(press('ArrowDown').defaultPrevented).toBe(true)
    expect(getFocusedLabel()).toBe('Three')

    press('ArrowDown')

    expect(getFocusedLabel()).toBe('One')
  })

  it('moves the focus to the previous item with ArrowUp and wraps around before the first one', async () => {
    await mountMenuListNavigation()

    getItem('Two').focus()
    press('ArrowUp')

    expect(getFocusedLabel()).toBe('One')

    press('ArrowUp')

    expect(getFocusedLabel()).toBe('Three')
  })

  it('moves the focus to the first item with Home and to the last one with End', async () => {
    await mountMenuListNavigation()

    getItem('Two').focus()
    press('End')

    expect(getFocusedLabel()).toBe('Three')

    press('Home')

    expect(getFocusedLabel()).toBe('One')
  })

  it('skips the items of a nested menu', async () => {
    await mountMenuListNavigation()

    getItem('Three').focus()
    press('ArrowDown')

    expect(getFocusedLabel()).toBe('One')
  })

  it('moves the focus with ArrowLeft and ArrowRight in a horizontal menu', async () => {
    await mountMenuListNavigation({ isHorizontal: true })

    getItem('One').focus()

    expect(press('ArrowDown').defaultPrevented).toBe(false)
    expect(getFocusedLabel()).toBe('One')

    press('ArrowRight')

    expect(getFocusedLabel()).toBe('Two')

    press('ArrowLeft')

    expect(getFocusedLabel()).toBe('One')
  })

  it.each(['Enter', ' '])('clicks the focused item with "%s"', async key => {
    const { onItemClick } = await mountMenuListNavigation()

    getItem('One').focus()

    expect(press(key).defaultPrevented).toBe(true)
    expect(onItemClick).toHaveBeenCalledOnce()
  })

  it('clicks the button of the focused item rather than the item itself', async () => {
    const { onButtonClick } = await mountMenuListNavigation()

    getItem('Two').focus()
    press('Enter')

    expect(onButtonClick).toHaveBeenCalledOnce()
  })

  it('closes the menu with Escape', async () => {
    const { onClose } = await mountMenuListNavigation()

    getItem('Two').focus()

    expect(press('Escape').defaultPrevented).toBe(true)
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('does not close the menu with ArrowLeft unless allowed', async () => {
    const { onClose } = await mountMenuListNavigation()

    getItem('Two').focus()
    press('ArrowLeft')

    expect(onClose).not.toHaveBeenCalled()
  })

  it('closes the menu with ArrowLeft when allowed', async () => {
    const { onClose } = await mountMenuListNavigation({ canCloseWithArrowLeft: true })

    getItem('Two').focus()
    press('ArrowLeft')

    expect(onClose).toHaveBeenCalledOnce()
  })

  it('leaves the menu with Tab without preventing the focus from moving', async () => {
    const { onClose, onLeave } = await mountMenuListNavigation()

    getItem('Two').focus()

    expect(press('Tab').defaultPrevented).toBe(false)
    expect(onLeave).toHaveBeenCalledOnce()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('ignores a key already handled by an outer listener', async () => {
    const { onClose } = await mountMenuListNavigation()

    getItem('Two').focus()
    window.addEventListener('keydown', event => event.preventDefault(), { capture: true, once: true })
    press('Escape')

    expect(onClose).not.toHaveBeenCalled()
  })

  it('ignores the keys when there is no target', async () => {
    const { onClose } = await mountMenuListNavigation({ hasTarget: false })

    getItem('One').focus()

    expect(press('ArrowDown').defaultPrevented).toBe(false)
    expect(getFocusedLabel()).toBe('One')

    press('Escape')

    expect(onClose).not.toHaveBeenCalled()
  })
})
