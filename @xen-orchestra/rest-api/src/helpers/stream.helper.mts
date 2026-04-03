export async function* makeNdJsonStream(iterable: Iterable<unknown> | AsyncIterable<unknown>) {
  for await (const object of iterable) {
    yield JSON.stringify(object) + '\n'
  }
}

export async function* makeJsonStream(iterable: Iterable<unknown> | AsyncIterable<unknown>) {
  yield '['
  let first = true
  for await (const object of iterable) {
    if (first) {
      first = false
      yield '\n'
    } else {
      yield ',\n'
    }
    yield JSON.stringify(object, null, 2)
  }
  yield '\n]\n'
}
