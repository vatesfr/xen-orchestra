/**
 * @param {Readable} inputStream
 * @param {Buffer} destinationBuffer
 * @returns {Promise<int>} Buffer length
 * @private
 */
export default function copyStreamToBuffer(inputStream, destinationBuffer) {
  return new Promise((resolve, reject) => {
    let index = 0

    inputStream.on('data', chunk => {
      chunk.copy(destinationBuffer, index)
      index += chunk.length
    })
    inputStream.on('end', () => resolve(index))
    inputStream.on('error', err => reject(err))
  })
}
