import type { TooltipEvents, TooltipOptions } from '@core/stores/tooltip.store'
import { useTooltipStore } from '@core/stores/tooltip.store'
import { isObject } from 'lodash-es'
import type { Options } from 'placement.js'
import type { Directive } from 'vue'

export type TooltipDirectiveContent = undefined | boolean | string

type TooltipDirectiveOptions =
  | TooltipDirectiveContent
  | {
      content?: TooltipDirectiveContent
      placement?: Options['placement']
      selector?: string
      vertical?: boolean
    }

const parseOptions = (options: TooltipDirectiveOptions): TooltipOptions => {
  const {
    placement,
    content,
    selector,
    vertical = false,
  } = isObject(options) ? options : { placement: undefined, content: options, selector: undefined, vertical: false }

  return {
    placement,
    content,
    selector,
    vertical,
  }
}

export const vTooltip: Directive<HTMLElement, TooltipDirectiveOptions> = {
  mounted(target, binding) {
    const store = useTooltipStore()

    const events: TooltipEvents = binding.modifiers.focus
      ? { on: 'focusin', off: 'focusout' }
      : { on: 'mouseenter', off: 'mouseleave' }

    store.register(target, parseOptions(binding.value), events)
  },
  updated(target, binding) {
    const store = useTooltipStore()
    store.updateOptions(target, parseOptions(binding.value))
  },
  beforeUnmount(target) {
    const store = useTooltipStore()
    store.unregister(target)
  },
}
