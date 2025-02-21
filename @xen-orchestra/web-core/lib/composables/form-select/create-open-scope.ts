import { onClickOutside, onKeyDown } from '@vueuse/core'
import { effectScope, type Ref } from 'vue'

export function createOpenScope(options: {
  dropdownRef: Ref<HTMLElement | undefined>
  inputRef: Ref<HTMLElement | undefined>
  activatePrevious: VoidFunction
  activateNext: VoidFunction
  toggleCurrent: VoidFunction
  close: VoidFunction
}) {
  const scope = effectScope()

  scope.run(() => {
    onKeyDown('ArrowUp', e => {
      e.preventDefault()
      options.activatePrevious()
    })

    onKeyDown('ArrowDown', e => {
      e.preventDefault()
      options.activateNext()
    })

    onKeyDown('Escape', e => {
      e.preventDefault()
      options.close()
    })

    onKeyDown(['Enter', ' '], e => {
      e.preventDefault()
      options.toggleCurrent()
    })

    onKeyDown('Tab', () => {
      options.close()
    })

    onClickOutside(options.dropdownRef, options.close, { ignore: [options.inputRef] })
  })

  return scope
}
