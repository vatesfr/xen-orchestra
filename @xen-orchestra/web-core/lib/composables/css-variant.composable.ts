import type { MaybeArray } from '@core/types/utility.type'
import type { VueClassProp } from '@core/types/vue-class-prop.type'
import { toArray } from '@core/utils/to-array.utils'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

type Props = Record<string, boolean | string | number>

export function useCssVariant<TProps extends Props>(
  baseClassName: string,
  config: {
    props: TProps
    variants: MaybeArray<keyof TProps>[]
    extras?: MaybeRefOrGetter<VueClassProp>
  }
) {
  const variantClasses = computed(() => {
    return config.variants.map(variantGroup => generateVariantClassName(baseClassName, config.props, variantGroup))
  })

  return computed(() => [baseClassName, toValue(config.extras), variantClasses.value])
}

function generateVariantClassName<TProps extends Props>(
  baseClassName: string,
  props: TProps,
  keys: MaybeArray<keyof TProps>
) {
  function keyToValue(key: keyof TProps) {
    return typeof props[key] === 'boolean' ? `${key as string}_${props[key] ? '1' : '0'}` : props[key]
  }

  const part = toArray(keys)
    .map(key => keyToValue(key))
    .join('--')

  return `${baseClassName}--${part}`
}
