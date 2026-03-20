export function safePushInMap<_Map extends Map<Key, Value[]>, Key, Value>(map: _Map, key: Key, value: Value) {
  if (!map.has(key)) {
    map.set(key, [])
  }

  map.get(key)!.push(value)
}
