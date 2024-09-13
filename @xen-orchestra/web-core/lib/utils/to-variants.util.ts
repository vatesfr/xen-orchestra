import type { StringKeyOf } from '@core/types/utility.type'

export function toVariants<TProps extends object>(
  props: TProps,
  keys: StringKeyOf<TProps>[] = Object.keys(props) as StringKeyOf<TProps>[]
): string[] {
  return keys.flatMap(key => {
    const value = props[key]

    if (!value) {
      return []
    }

    if (value === true) {
      return key
    }

    return `${key}--${props[key]}`
  })
}
