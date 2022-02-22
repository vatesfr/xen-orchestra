export class VirtualBuffer {
  constructor(readStream) {
    this._readStream = readStream
    readStream.on('readable', () => {
      this._tryToMoveQueue()
    })
    readStream.on('error', error => {
      this._queue.forEach(e => e.reject(error))
      this._queue.length = 0
    })
    readStream.on('end', () => {
      const error = new Error('stream ended')
      this._queue.forEach(e => e.reject(error))
      this._queue.length = 0
    })
    this._queue = []
    this.position = 0
  }

  _tryToMoveQueue() {
    const queue = this._queue
    while (queue.length > 0 && queue[0].tryToRead()) {
      queue.shift()
    }
  }

  async readChunk(length, label) {
    const promise = new Promise((resolve, reject) => {
      if (length === 0) {
        resolve(Buffer.alloc(0))
      } else {
        this._queue.push({
          reject,
          // putting the label in the _queue, it's useful when debugging.
          label,
          tryToRead: () => {
            const result = this._readStream.read(length)
            if (result !== null) {
              this.position += result.length
              resolve(result)
            }
            return !!result
          },
        })
      }
    })
    this._tryToMoveQueue()
    return promise
  }
}
