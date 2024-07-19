import type { MaybeArray } from '@core/types/utility.type'
import type { VueClassProp } from '@core/types/vue-class-prop.type'
import { toArray } from '@core/utils/to-array.utils'
import { computed, type MaybeRefOrGetter, normalizeClass, toValue } from 'vue'

type BaseConfig = {
  customVariants?: MaybeRefOrGetter<VueClassProp>
  extraClasses?: MaybeRefOrGetter<VueClassProp>
}

type WithVariantConfig<TProps extends object> = BaseConfig & {
  props: TProps
  variants: MaybeArray<keyof TProps>[]
}

export function useCssClass<TProps extends object>(
  baseClassName: string,
  config: BaseConfig | WithVariantConfig<TProps>
) {
  const variantClasses = computed(() => {
    const { variants, props } = config as WithVariantConfig<TProps>

    if (!variants || !props) {
      return undefined
    }

    return variants?.map(variantGroup => generateVariantClassName(baseClassName, props, variantGroup))
  })

  const customVariantClasses = computed(() => {
    const value = normalizeClass(toValue(config.customVariants))

    if (value === '') {
      return undefined
    }

    return value
      .split(' ')
      .map(className => `${baseClassName}--x-${className}`)
      .join(' ')
  })

  return computed(() => [baseClassName, variantClasses.value, customVariantClasses.value, toValue(config.extraClasses)])
}

function generateVariantClassName<TProps extends object>(
  baseClassName: string,
  props: TProps,
  keys: MaybeArray<keyof TProps>
) {
  function keyToValue(key: keyof TProps) {
    if (props[key] === false || props[key] === undefined) {
      return `${key as string}_0`
    }

    if (props[key] === true) {
      return `${key as string}_1`
    }

    return props[key]
  }

  const part = toArray(keys)
    .map(key => keyToValue(key))
    .join('--')

  return `${baseClassName}--${part}`
}
