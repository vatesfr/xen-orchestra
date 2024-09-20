import type { MaybeRefOrGetter } from 'vue'
import { computed, toValue } from 'vue'
import type { RouteLocationRaw } from 'vue-router'

type Options = {
  to?: RouteLocationRaw
  href?: string
  target?: '_blank' | '_self'
  disabled?: boolean
}

export function useLinkComponent(defaultComponent: string, options: MaybeRefOrGetter<Options>) {
  const config = computed(() => toValue(options))

  const isDisabled = computed(() => config.value.disabled || (!config.value.to && !config.value.href))

  const component = computed(() => {
    if (isDisabled.value) {
      return defaultComponent
    }

    if (config.value.href) {
      return 'a'
    }

    return 'RouterLink'
  })

  const attributes = computed(() => {
    if (isDisabled.value) {
      return {}
    }

    if (config.value.href) {
      return {
        rel: 'noopener noreferrer',
        target: config.value.target ?? '_blank',
        href: config.value.href,
      }
    }

    return {
      target: config.value.target,
      to: config.value.to,
    }
  })

  return {
    isDisabled,
    component,
    attributes,
  }
}
