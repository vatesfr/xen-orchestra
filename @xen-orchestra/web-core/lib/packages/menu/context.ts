import { uniqueId } from '@core/utils/unique-id.util'
import { useEventListener } from '@vueuse/core'
import { type Ref, ref } from 'vue'

export class MenuContext {
  id: string

  activeItemId: Ref<symbol | undefined> = ref()

  constructor() {
    this.id = uniqueId()

    useEventListener(window, 'click', (event: PointerEvent) => {
      if (this.hasSameController(event)) {
        return
      }

      this.activeItemId.value = undefined
    })
  }

  hasSameController(event: PointerEvent) {
    return Array.from(window.document.querySelectorAll(`[data-menu-id="${this.id}"]`)).some(
      el => el === event.target || event.composedPath().includes(el)
    )
  }
}
