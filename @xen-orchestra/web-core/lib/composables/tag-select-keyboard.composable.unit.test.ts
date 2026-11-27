import { useTagSelectKeyboard } from '@core/composables/tag-select-keyboard.composable.ts'
import { getFocusedLabel, press } from '@core-test/keyboard.ts'
import { mountWithSetup } from '@core-test/mount-with-setup.ts'
import { h, nextTick, ref } from 'vue'

async function mountTagSelectKeyboard({ hasTarget = true }: { hasTarget?: boolean } = {}) {
  const onCancel = vi.fn()
  const onFocusLost = vi.fn()
  const onParentKeydown = vi.fn()
  const onItemClick = vi.fn()
  const isRemoveVisible = ref(true)
  const isSelectAllDisabled = ref(false)

  function renderItem(label: string) {
    return h(
      'div',
      {
        class: 'item',
        tabindex: -1,
        'aria-label': label,
        // Like the form-select options, which move the focus back to the search input once toggled
        onClick: () => {
          onItemClick(label)
          getElement('Search').focus()
        },
      },
      [h('input', { type: 'checkbox', 'aria-label': `${label} checkbox` })]
    )
  }

  mountWithSetup(
    () => {
      const dropdown = ref<HTMLElement>()

      useTagSelectKeyboard({
        target: () => (hasTarget ? dropdown.value : undefined),
        itemSelector: '.item',
        onCancel,
        onFocusLost,
      })

      return () =>
        h('div', { onKeydown: onParentKeydown }, [
          h('div', { ref: dropdown }, [
            isRemoveVisible.value
              ? h(
                  'button',
                  {
                    // Like the tag remove button, which stops the click propagation
                    onClick: (event: MouseEvent) => {
                      event.stopPropagation()
                      isRemoveVisible.value = false
                    },
                  },
                  'Remove'
                )
              : undefined,
            h('input', { 'aria-label': 'Search' }),
            h('button', { disabled: isSelectAllDisabled.value, onClick: () => (isSelectAllDisabled.value = true) }, [
              'Select all',
            ]),
            renderItem('Option A'),
            renderItem('Option B'),
            h('button', 'Save'),
          ]),
        ])
    },
    { attachTo: document.body }
  )

  await nextTick()

  return { onCancel, onFocusLost, onParentKeydown, onItemClick, isSelectAllDisabled }
}

function getElement(label: string) {
  const element = Array.from(document.querySelectorAll<HTMLElement>('button, input, [aria-label]')).find(
    element => element.textContent === label || element.getAttribute('aria-label') === label
  )

  if (element === undefined) {
    throw new Error(`No element labeled "${label}"`)
  }

  return element
}

function waitForFocusCheck() {
  return new Promise(resolve => setTimeout(resolve))
}

describe('Tab', () => {
  it('goes through the controls and the items, skipping the focusable elements inside the items', async () => {
    await mountTagSelectKeyboard()

    getElement('Remove').focus()

    const focusedLabels = Array.from({ length: 6 }, () => {
      press('Tab')

      return getFocusedLabel()
    })

    expect(focusedLabels).toEqual(['Search', 'Select all', 'Option A', 'Option B', 'Save', 'Remove'])
  })

  it('skips the disabled controls', async () => {
    const { isSelectAllDisabled } = await mountTagSelectKeyboard()

    isSelectAllDisabled.value = true
    await nextTick()

    getElement('Search').focus()
    press('Tab')

    expect(getFocusedLabel()).toBe('Option A')
  })

  it('moves the focus backward with Shift, wrapping from the first focusable element to the last one', async () => {
    await mountTagSelectKeyboard()

    getElement('Search').focus()
    press('Tab', { shiftKey: true })

    expect(getFocusedLabel()).toBe('Remove')

    press('Tab', { shiftKey: true })

    expect(getFocusedLabel()).toBe('Save')

    press('Tab', { shiftKey: true })

    expect(getFocusedLabel()).toBe('Option B')
  })

  it('prevents the native behavior and does not reach the parent listeners', async () => {
    const { onParentKeydown } = await mountTagSelectKeyboard()

    getElement('Search').focus()

    expect(press('Tab').defaultPrevented).toBe(true)
    expect(onParentKeydown).not.toHaveBeenCalled()
  })
})

describe('items', () => {
  it.each(['Enter', ' '])('toggles the focused item with "%s" and keeps the focus on it', async key => {
    const { onItemClick, onParentKeydown } = await mountTagSelectKeyboard()

    getElement('Option B').focus()

    expect(press(key).defaultPrevented).toBe(true)
    expect(onItemClick).toHaveBeenCalledExactlyOnceWith('Option B')
    expect(getFocusedLabel()).toBe('Option B')
    expect(onParentKeydown).not.toHaveBeenCalled()
  })

  it('moves the focus between the items with the arrow keys, wrapping around', async () => {
    const { onParentKeydown } = await mountTagSelectKeyboard()

    getElement('Option A').focus()
    press('ArrowDown')

    expect(getFocusedLabel()).toBe('Option B')

    press('ArrowDown')

    expect(getFocusedLabel()).toBe('Option A')

    press('ArrowUp')

    expect(getFocusedLabel()).toBe('Option B')
    expect(onParentKeydown).not.toHaveBeenCalled()
  })

  it('does not let the other keys reach the parent listeners', async () => {
    const { onParentKeydown } = await mountTagSelectKeyboard()

    getElement('Option A').focus()
    press('Home')

    expect(onParentKeydown).not.toHaveBeenCalled()
  })
})

describe('Escape', () => {
  it('cancels without reaching the parent listeners', async () => {
    const { onCancel, onParentKeydown } = await mountTagSelectKeyboard()

    getElement('Save').focus()

    expect(press('Escape').defaultPrevented).toBe(true)
    expect(onCancel).toHaveBeenCalledOnce()
    expect(onParentKeydown).not.toHaveBeenCalled()
  })
})

describe('other keys', () => {
  it('keeps the native behavior of buttons without reaching the parent listeners', async () => {
    const { onParentKeydown } = await mountTagSelectKeyboard()

    getElement('Save').focus()

    expect(press('Enter').defaultPrevented).toBe(false)
    expect(press(' ').defaultPrevented).toBe(false)
    expect(press('ArrowDown').defaultPrevented).toBe(false)
    expect(onParentKeydown).not.toHaveBeenCalled()
  })

  it('lets the keys pressed in the search input reach the parent listeners', async () => {
    const { onParentKeydown } = await mountTagSelectKeyboard()

    getElement('Search').focus()
    press('ArrowDown')
    press('Enter')

    expect(onParentKeydown).toHaveBeenCalledTimes(2)
  })
})

describe('focus recovery', () => {
  it('calls onFocusLost when a click removes the focused element', async () => {
    const { onFocusLost } = await mountTagSelectKeyboard()

    const removeButton = getElement('Remove')

    removeButton.focus()
    removeButton.click()
    await waitForFocusCheck()

    expect(onFocusLost).toHaveBeenCalledOnce()
  })

  it('calls onFocusLost when a click disables the focused element', async () => {
    const { onFocusLost } = await mountTagSelectKeyboard()

    const selectAllButton = getElement('Select all')

    selectAllButton.focus()
    selectAllButton.click()
    await waitForFocusCheck()

    expect(onFocusLost).toHaveBeenCalledOnce()
  })

  it('does not call onFocusLost when the focus stays in the dropdown', async () => {
    const { onFocusLost } = await mountTagSelectKeyboard()

    const saveButton = getElement('Save')

    saveButton.focus()
    saveButton.click()
    await waitForFocusCheck()

    expect(onFocusLost).not.toHaveBeenCalled()
  })
})

describe('without target', () => {
  it('does nothing', async () => {
    const { onCancel, onParentKeydown } = await mountTagSelectKeyboard({ hasTarget: false })

    getElement('Search').focus()
    press('Escape')

    expect(onCancel).not.toHaveBeenCalled()
    expect(onParentKeydown).toHaveBeenCalledOnce()
  })
})
