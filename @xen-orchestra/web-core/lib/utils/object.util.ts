export function objectEntries<T, K extends string = string>(obj: { [Key in K]: T } | ArrayLike<T>): [K, T][] {
  return Object.entries(obj) as [K, T][]
}

export function objectFromEntries<T = any, K extends PropertyKey = PropertyKey>(
  entries: Iterable<readonly [K, T]>
): { [Key in K]: T } {
  return Object.fromEntries(entries) as { [Key in K]: T }
}

export function hasObjectProperty<TSource, TProperty extends PropertyKey>(
  source: TSource,
  property: TProperty
): source is TSource & Record<TProperty, unknown> {
  return typeof source === 'object' && source !== null && Object.prototype.hasOwnProperty.call(source, property)
}
