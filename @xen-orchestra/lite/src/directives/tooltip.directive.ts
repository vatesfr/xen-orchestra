import type { TooltipEvents, TooltipOptions } from '@/stores/tooltip.store'
import { useTooltipStore } from '@/stores/tooltip.store'
import { isObject } from 'lodash-es'
import type { Options } from 'placement.js'
import type { Directive } from 'vue'

type TooltipDirectiveContent = undefined | boolean | string

type TooltipDirectiveOptions =
  | TooltipDirectiveContent
  | {
      content?: TooltipDirectiveContent
      placement?: Options['placement']
    }

const parseOptions = (options: TooltipDirectiveOptions, target: HTMLElement): TooltipOptions => {
  const { placement, content } = isObject(options) ? options : { placement: undefined, content: options }

  return {
    placement,
    content: content === true || content === undefined ? target.innerText.trim() : content,
  }
}

export const vTooltip: Directive<HTMLElement, TooltipDirectiveOptions> = {
  mounted(target, binding) {
    const store = useTooltipStore()

    const events: TooltipEvents = binding.modifiers.focus
      ? { on: 'focusin', off: 'focusout' }
      : { on: 'mouseenter', off: 'mouseleave' }

    store.register(target, parseOptions(binding.value, target), events)
  },
  updated(target, binding) {
    const store = useTooltipStore()
    store.updateOptions(target, parseOptions(binding.value, target))
  },
  beforeUnmount(target) {
    const store = useTooltipStore()
    store.unregister(target)
  },
}
