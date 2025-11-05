export function toTuple<T>(value: undefined | T | [T, T], defaultValue: [T, T]): [T, T] {
  if (value === undefined) {
    return defaultValue
  }

  return Array.isArray(value) ? value : [value, value]
}
