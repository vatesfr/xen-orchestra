export default async function readChunk(stream, n) {
  if (n === 0) {
    return Buffer.alloc(0)
  }
  return new Promise((resolve, reject) => {
    const chunks = []
    let i = 0

    function clean() {
      stream.removeListener('readable', onReadable)
      stream.removeListener('end', onEnd)
      stream.removeListener('error', onError)
    }

    function resolve2() {
      clean()
      resolve(Buffer.concat(chunks, i))
    }

    const onEnd = resolve2

    function onError(error) {
      reject(error)
      clean()
    }

    function onReadable() {
      const chunk = stream.read(n - i)
      if (chunk === null) {
        return // wait for more data
      }
      i += chunk.length
      chunks.push(chunk)

      if (i === n) {
        resolve2()
      } else if (i > n) {
        throw new RangeError(`read (${i}) more than expected (${n})`)
      }
    }

    stream.on('end', onEnd)
    stream.on('error', onError)
    stream.on('readable', onReadable)

    if (stream.readable) {
      onReadable()
    }
  })
}
