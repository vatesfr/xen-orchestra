export function* makeNdJsonStream(array: unknown[]) {
  for (const object of array) {
    yield JSON.stringify(object) + '\n'
  }
}
