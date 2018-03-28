// TODO: remove this copied code

export { lastly as pFinally } from 'promise-toolbox'
export const noop = () => {}

export const getPseudoRandomBytes = n => {
  const bytes = Buffer.allocUnsafe(n)

  const odd = n & 1
  for (let i = 0, m = n - odd; i < m; i += 2) {
    bytes.writeUInt16BE((Math.random() * 65536) | 0, i)
  }

  if (odd) {
    bytes.writeUInt8((Math.random() * 256) | 0, n - 1)
  }

  return bytes
}

export const streamToNewBuffer = stream =>
  new Promise((resolve, reject) => {
    const chunks = []
    let length = 0

    const onData = chunk => {
      chunks.push(chunk)
      length += chunk.length
    }
    stream.on('data', onData)

    const clean = () => {
      stream.removeListener('data', onData)
      stream.removeListener('end', onEnd)
      stream.removeListener('error', onError)
    }
    const onEnd = () => {
      resolve(Buffer.concat(chunks, length))
      clean()
    }
    stream.on('end', onEnd)
    const onError = error => {
      reject(error)
      clean()
    }
    stream.on('error', onError)
  })

export { streamToNewBuffer as streamToBuffer }
