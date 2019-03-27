'use strict'

import { Slicer } from 'pipette'

export class VirtualBuffer {
  constructor(readStream) {
    this.slicer = new Slicer(readStream)
    this.position = 0
    this.promise = null
  }

  get isDepleted() {
    return !this.slicer.readable
  }

  async readChunk(length, label) {
    const _this = this
    if (this.promise !== null) {
      throw new Error('pomise already there !!!', this.promise)
    }
    this.promise = label
    return new Promise((resolve, reject) => {
      this.slicer.read(length, (error, actualLength, data, offset) => {
        if (error !== false && error !== true) {
          _this.promise = null
          reject(error)
        } else {
          _this.promise = null
          _this.position += data.length
          resolve(data)
        }
      })
    })
  }
}
