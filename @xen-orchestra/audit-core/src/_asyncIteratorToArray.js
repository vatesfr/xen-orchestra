const asyncIteratorToArray = async asyncIterator => {
  const array = []
  for await (const entry of asyncIterator) {
    array.push(entry)
  }
  return array
}

export { asyncIteratorToArray }
