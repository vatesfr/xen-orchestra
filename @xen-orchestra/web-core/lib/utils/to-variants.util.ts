export function toVariants(variants: object): string[] {
  return Object.entries(variants).flatMap(([key, value]) => {
    if (!value) {
      return []
    }

    return value === true ? key : `${key}--${value}`
  })
}
