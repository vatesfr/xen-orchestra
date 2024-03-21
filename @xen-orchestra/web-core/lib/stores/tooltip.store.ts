import type { TooltipDirectiveContent } from '@core/directives/tooltip.directive'
import { uniqueId } from '@core/utils/unique-id.util'
import { useEventListener, type WindowEventName } from '@vueuse/core'
import { defineStore } from 'pinia'
import type { Options } from 'placement.js'
import { computed, type EffectScope, effectScope, ref } from 'vue'

export type TooltipOptions = {
  content: TooltipDirectiveContent
  placement: Options['placement']
  selector: string | undefined
  vertical: boolean
}

export type TooltipEvents = { on: WindowEventName; off: WindowEventName }

export const useTooltipStore = defineStore('tooltip', () => {
  const targetsScopes = new WeakMap<HTMLElement, EffectScope>()
  const targets = ref(new Set<HTMLElement>())
  const targetsOptions = ref(new Map<HTMLElement, TooltipOptions>())
  const targetsIds = ref(new Map<HTMLElement, string>())

  const register = (target: HTMLElement, options: TooltipOptions, events: TooltipEvents) => {
    const scope = effectScope()

    targetsScopes.set(target, scope)
    targetsOptions.value.set(target, options)
    targetsIds.value.set(target, uniqueId('tooltip-'))

    scope.run(() => {
      useEventListener(target, events.on, () => {
        targets.value.add(target)

        scope.run(() => {
          useEventListener(
            target,
            events.off,
            () => {
              targets.value.delete(target)
            },
            { once: true }
          )
        })
      })
    })
  }

  const updateOptions = (target: HTMLElement, options: TooltipOptions) => {
    targetsOptions.value.set(target, options)
  }

  const unregister = (target: HTMLElement) => {
    targets.value.delete(target)
    targetsOptions.value.delete(target)
    targetsScopes.get(target)?.stop()
    targetsScopes.delete(target)
    targetsIds.value.delete(target)
  }

  return {
    register,
    unregister,
    updateOptions,
    tooltips: computed(() => {
      return Array.from(targets.value.values()).map(target => {
        return {
          target,
          options: targetsOptions.value.get(target)!,
          key: targetsIds.value.get(target)!,
        }
      })
    }),
  }
})
