import { onKeyDown } from '@vueuse/core'
import { effectScope } from 'vue'

export function createFocusScope(options: { open: VoidFunction }) {
  const scope = effectScope()

  scope.run(() => {
    onKeyDown(['ArrowUp', 'ArrowDown', 'Enter', ' '], e => {
      e.preventDefault()
      options.open()
    })
  })

  return scope
}
