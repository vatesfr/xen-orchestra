'use strict'

export class VirtualBuffer {
  constructor(readStream) {
    const _this = this
    this.readStream = readStream
    readStream.on('readable', () => {
      _this.tryToMoveQueue()
    })
    readStream.on('error', error => {
      this.queue.forEach(e => e.reject(error))
      this.queue.length = 0
    })
    readStream.on('end', () => {
      this.queue.forEach(e => e.reject())
      this.queue.length = 0
    })
    this.queue = []
    this.position = 0
  }

  tryToMoveQueue() {
    const { queue } = this
    while (queue.length > 0 && queue[0].tryToRead()) {
      queue.shift()
    }
  }

  async readChunk(length, label) {
    const _this = this
    const promise = new Promise((resolve, reject) => {
      if (length === 0) {
        resolve(Buffer.alloc(0))
      } else {
        this.queue.push({
          reject,
          // putting the label in the queue, it's useful when debugging.
          label,
          tryToRead() {
            const result = _this.readStream.read(length)
            if (result !== null) {
              _this.position += result.length
              resolve(result)
            }
            return !!result
          },
        })
      }
    })
    this.tryToMoveQueue()
    return promise
  }
}
