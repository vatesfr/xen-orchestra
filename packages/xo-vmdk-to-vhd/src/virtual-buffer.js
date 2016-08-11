'use strict'

export class VirtualBuffer {
  constructor (readStream) {
    this.readStream = readStream
    this.buffer = new Buffer(0)
    this.size = 0
    this.position = 0
    this.finished = false
    this.readStream.on('data', (buffer) => {
      // TODO: not concatenating but keeping a nice list of buffers
      this.buffer = Buffer.concat([this.buffer, buffer])
      this._tryToFlushPromises()
      this.size += buffer.length
    })
    this.readStream.on('end', () => {
      this.finished = true
      this._tryToFlushPromises()
    })
    this.waitingPromises = []
  }

  get isDepleted () {
    return this.finished && this.position === this.size
  }

  _tryToFlushPromises () {
    if (this.waitingPromises.length === 0) {
      return
    }
    const top = this.waitingPromises[0]
    if (this.finished && top.length !== -1 && this.size < top.offset + top.length) {
      for (let p of this.waitingPromises) {
        p.promise.reject({message: 'tried to read past the end'})
      }
      this.waitingPromises = []
      return
    }
    if (top.length === -1 && this.finished) {
      this.waitingPromises.shift()
      const returnValue = this.buffer
      this.buffer = new Buffer(0)
      this.position += returnValue.length
      top.promise.resolve(returnValue)
    } else {
      if (top.length !== -1 && this.size >= top.offset + top.length) {
        this.waitingPromises.shift()
        // TODO: not concatenating but keeping a nice list of buffers
        const returnValue = new Buffer(this.buffer.slice(top.offset - this.position, top.length))
        this.buffer = new Buffer(this.buffer.slice(top.length))
        this.position = top.offset + top.length
        top.promise.resolve(returnValue)
        this._tryToFlushPromises()
      }
    }
  }

  // length = -1 means 'until the end'
  readChunk (offset, length) {
    if (offset < this.position) {
      throw new Error('tried to read backwards asked offset:' + offset + ' current position:' + this.position)
    }
    return new Promise((resolve, reject) => {
      this.waitingPromises.push({promise: {resolve, reject}, offset, length})
      this.waitingPromises.sort((e1, e2) => {
        return e1.offset - e2.offset
      })
      this._tryToFlushPromises()
    })
  }
}
