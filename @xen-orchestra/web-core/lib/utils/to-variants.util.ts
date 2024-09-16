export function toVariants(variants: object): string[] {
  return Object.entries(variants).flatMap(([key, value]) => {
    if (value === true) {
      return `${key}--1`
    }

    if (value === false) {
      return `${key}--0`
    }

    if (!value) {
      return []
    }

    return `${key}--${value}`
  })
}
