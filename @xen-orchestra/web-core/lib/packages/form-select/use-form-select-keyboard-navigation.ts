import { onKeyStroke } from '@vueuse/core'
import { ref, type Ref } from 'vue'
import { FORM_SELECT_HANDLED_KEY, type FormOptionIndex } from './types.ts'

export function useFormSelectKeyboardNavigation({
  target,
  isOpen,
  isMultiple,
  onOpen,
  onClose,
  onMove,
  onToggle,
  onSelect,
}: {
  target: Ref<HTMLElement | undefined>
  isOpen: Ref<boolean>
  isMultiple: Ref<boolean>
  onOpen: () => void
  onClose: (keepFocus: boolean) => void
  onMove: (index: FormOptionIndex) => void
  onToggle: () => void
  onSelect: () => void
}) {
  const isNavigatingWithKeyboard = ref(false)

  function stopKeyboardNavigation() {
    if (isNavigatingWithKeyboard.value) {
      isNavigatingWithKeyboard.value = false
    }
  }

  function handleArrowUpDownKeys(event: KeyboardEvent, key: FORM_SELECT_HANDLED_KEY.UP | FORM_SELECT_HANDLED_KEY.DOWN) {
    event.preventDefault()

    isNavigatingWithKeyboard.value = true

    if (!isOpen.value) {
      return onOpen()
    }

    onMove(key === FORM_SELECT_HANDLED_KEY.UP ? 'previous' : 'next')
  }

  function handlePageUpDownKeys(
    event: KeyboardEvent,
    key: FORM_SELECT_HANDLED_KEY.PAGE_UP | FORM_SELECT_HANDLED_KEY.PAGE_DOWN
  ) {
    event.preventDefault()

    isNavigatingWithKeyboard.value = true

    if (!isOpen.value) {
      return onOpen()
    }

    onMove(key === FORM_SELECT_HANDLED_KEY.PAGE_UP ? 'previous-page' : 'next-page')
  }

  function handleHomeEndKeys(event: KeyboardEvent, key: FORM_SELECT_HANDLED_KEY.HOME | FORM_SELECT_HANDLED_KEY.END) {
    if (!isOpen.value) {
      return
    }

    event.preventDefault()

    isNavigatingWithKeyboard.value = true

    onMove(key === FORM_SELECT_HANDLED_KEY.HOME ? 'first' : 'last')
  }

  function handleLeftRightKeys() {
    isNavigatingWithKeyboard.value = false
  }

  function handleEnterSpaceKeys(
    event: KeyboardEvent,
    key: FORM_SELECT_HANDLED_KEY.ENTER | FORM_SELECT_HANDLED_KEY.SPACE
  ) {
    if (key === FORM_SELECT_HANDLED_KEY.SPACE && !isNavigatingWithKeyboard.value) {
      return
    }

    event.preventDefault()

    if (!isOpen.value) {
      return onOpen()
    }

    if (isMultiple.value) {
      onToggle()
    } else {
      onSelect()
      onClose(true)
    }
  }

  function handleTabEscapeKeys(
    event: KeyboardEvent,
    key: FORM_SELECT_HANDLED_KEY.TAB | FORM_SELECT_HANDLED_KEY.ESCAPE
  ) {
    if (key === FORM_SELECT_HANDLED_KEY.ESCAPE && isOpen.value) {
      event.preventDefault()
    }

    onClose(key === FORM_SELECT_HANDLED_KEY.ESCAPE)
  }

  const handledKeys = Object.values(FORM_SELECT_HANDLED_KEY)

  onKeyStroke(
    handledKeys,
    (event): void => {
      const key = event.key as FORM_SELECT_HANDLED_KEY

      switch (key) {
        case FORM_SELECT_HANDLED_KEY.DOWN:
        case FORM_SELECT_HANDLED_KEY.UP:
          return handleArrowUpDownKeys(event, key)
        case FORM_SELECT_HANDLED_KEY.PAGE_DOWN:
        case FORM_SELECT_HANDLED_KEY.PAGE_UP:
          return handlePageUpDownKeys(event, key)
        case FORM_SELECT_HANDLED_KEY.HOME:
        case FORM_SELECT_HANDLED_KEY.END:
          return handleHomeEndKeys(event, key)
        case FORM_SELECT_HANDLED_KEY.ENTER:
        case FORM_SELECT_HANDLED_KEY.SPACE:
          return handleEnterSpaceKeys(event, key)
        case FORM_SELECT_HANDLED_KEY.LEFT:
        case FORM_SELECT_HANDLED_KEY.RIGHT:
          return handleLeftRightKeys()
        case FORM_SELECT_HANDLED_KEY.TAB:
        case FORM_SELECT_HANDLED_KEY.ESCAPE:
          return handleTabEscapeKeys(event, key)
        default:
          return key
      }
    },
    { target }
  )

  return {
    isNavigatingWithKeyboard,
    stopKeyboardNavigation,
  }
}
