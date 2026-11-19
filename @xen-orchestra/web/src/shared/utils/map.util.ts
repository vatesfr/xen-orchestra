export function safePushInMap<TMap extends Map<Key, Value[]>, Key, Value>(map: TMap, key: Key, value: Value) {
  const values = map.get(key)

  if (values !== undefined) {
    values.push(value)
  } else {
    map.set(key, [value])
  }
}
