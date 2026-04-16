export function safePushInMap<_Map extends Map<Key, Value[]>, Key, Value>(map: _Map, key: Key, value: Value) {
  const values = map.get(key)

  if (values !== undefined) {
    values.push(value)
  } else {
    map.set(key, [value])
  }
}
