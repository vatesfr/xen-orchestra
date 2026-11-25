import { useMenuListNavigation } from '@core/composables/menu-list-navigation.composable.ts'
import { mountWithSetupResult } from '@core-test/mount-with-setup.ts'
import { h, nextTick, ref } from 'vue'

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

  const {
    result: { focusFirstItem },
  } = mountWithSetupResult(
    () => {
      const menu = ref<HTMLElement>()

      return {
        result: useMenuListNavigation({
          target: () => (hasTarget ? menu.value : undefined),
          isHorizontal,
          canCloseWithArrowLeft,
          onClose,
          onLeave,
        }),
        render: () =>
          h('ul', { ref: menu, class: 'menu-list' }, [
            h('li', [h('div', { class: 'menu-trigger', tabindex: -1, onClick: onItemClick }, 'One')]),
            h('li', [
              h('div', { class: 'menu-trigger', tabindex: -1 }, [h('button', { onClick: onButtonClick }, 'Two')]),
            ]),
            h('li', [
              h('div', { class: 'menu-trigger', tabindex: -1 }, 'Three'),
              h('ul', { class: 'menu-list' }, [h('li', [h('div', { class: 'menu-trigger', tabindex: -1 }, 'Nested')])]),
            ]),
          ]),
      }
    },
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
  it.each([
    { label: 'to the next item with ArrowDown', key: 'ArrowDown', from: 'Two', to: 'Three' },
    {
      label: 'back to the first item after the last one, skipping a nested menu',
      key: 'ArrowDown',
      from: 'Three',
      to: 'One',
    },
    { label: 'to the previous item with ArrowUp', key: 'ArrowUp', from: 'Two', to: 'One' },
    { label: 'to the last item before the first one', key: 'ArrowUp', from: 'One', to: 'Three' },
    { label: 'to the last item with End', key: 'End', from: 'Two', to: 'Three' },
    { label: 'to the first item with Home', key: 'Home', from: 'Three', to: 'One' },
    {
      label: 'to the next item with ArrowRight in a horizontal menu',
      isHorizontal: true,
      key: 'ArrowRight',
      from: 'One',
      to: 'Two',
    },
    {
      label: 'to the previous item with ArrowLeft in a horizontal menu',
      isHorizontal: true,
      key: 'ArrowLeft',
      from: 'Two',
      to: 'One',
    },
  ])('moves the focus $label', async ({ isHorizontal, key, from, to }) => {
    await mountMenuListNavigation({ isHorizontal })

    getItem(from).focus()

    expect(press(key).defaultPrevented).toBe(true)
    expect(getFocusedLabel()).toBe(to)
  })

  it('keeps the focus on ArrowDown in a horizontal menu', async () => {
    await mountMenuListNavigation({ isHorizontal: true })

    getItem('One').focus()

    expect(press('ArrowDown').defaultPrevented).toBe(false)
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

  it.each([
    { label: 'does not close the menu with ArrowLeft unless allowed', canCloseWithArrowLeft: false, closeCount: 0 },
    { label: 'closes the menu with ArrowLeft when allowed', canCloseWithArrowLeft: true, closeCount: 1 },
  ])('$label', async ({ canCloseWithArrowLeft, closeCount }) => {
    const { onClose } = await mountMenuListNavigation({ canCloseWithArrowLeft })

    getItem('Two').focus()
    press('ArrowLeft')

    expect(onClose).toHaveBeenCalledTimes(closeCount)
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
