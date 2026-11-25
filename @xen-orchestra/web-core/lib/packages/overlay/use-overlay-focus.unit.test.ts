import VtsOverlayList from '@core/components/overlay/VtsOverlayList.vue'
import { useOverlayFocus } from '@core/packages/overlay/use-overlay-focus.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { createGlobalTestConfig } from '@core-test/create-global-test-config.ts'
import { mountWithSetupResult } from '@core-test/mount-with-setup.ts'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h, onMounted, ref, type VNodeChild } from 'vue'

const AutofocusInput = defineComponent({
  setup() {
    const input = ref<HTMLInputElement>()

    onMounted(() => input.value?.focus())

    return () => h('input', { ref: input, class: 'autofocus-input' })
  },
})

function createTestModal(content: () => VNodeChild = () => null) {
  return defineComponent({
    emits: ['confirm'],
    setup(props, { emit }) {
      const dialog = ref<HTMLElement>()

      useOverlayFocus(dialog)

      return () =>
        h('div', { ref: dialog, class: 'dialog', tabindex: -1 }, [
          content(),
          h('button', { class: 'confirm', onClick: () => emit('confirm') }, 'Confirm'),
        ])
    },
  })
}

function mountOverlayHost(modal = createTestModal()) {
  const { result: overlay } = mountWithSetupResult(
    () => ({
      result: useOverlay({ component: () => Promise.resolve(modal), events: { onConfirm: true } }),
      render: () => [h('button', { class: 'opener' }, 'Open'), h(VtsOverlayList)],
    }),
    { attachTo: document.body }
  )

  return { open: overlay.open, opener: getElement('.opener') }
}

function getElement(selector: string) {
  const element = document.querySelector<HTMLElement>(selector)

  if (element === null) {
    throw new Error(`No element matches "${selector}"`)
  }

  return element
}

describe('useOverlayFocus', () => {
  it('moves the focus into the overlay once it is open', async () => {
    const { open, opener } = mountOverlayHost()

    opener.focus()
    open()
    await flushPromises()

    expect(document.activeElement).toBe(getElement('.dialog'))
  })

  it('keeps the focus on an element that the overlay content focused itself', async () => {
    const { open, opener } = mountOverlayHost(createTestModal(() => h(AutofocusInput)))

    opener.focus()
    open()
    await flushPromises()

    expect(document.activeElement).toBe(getElement('.autofocus-input'))
  })

  it('gives the focus back to the opener before open() resolves', async () => {
    const { open, opener } = mountOverlayHost()

    opener.focus()
    const response = open()
    await flushPromises()

    getElement('.confirm').click()
    await response

    expect(document.activeElement).toBe(opener)
  })

  it('does not give the focus back to an opener that left the page', async () => {
    const { open, opener } = mountOverlayHost()

    opener.focus()
    const response = open()
    await flushPromises()

    opener.remove()
    getElement('.confirm').click()
    await response

    expect(document.activeElement).not.toBe(opener)
  })

  it('does not move the focus outside of an overlay', () => {
    mount(createTestModal(), { global: createGlobalTestConfig(), attachTo: document.body })

    expect(document.activeElement).not.toBe(getElement('.dialog'))
  })
})
