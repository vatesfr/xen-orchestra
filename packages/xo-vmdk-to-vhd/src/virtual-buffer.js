'use strict'

import {Slicer} from 'pipette'

const chunkSize = 1024 * 1024

export class VirtualBuffer {
  constructor (readStream) {
    this.slicer = new Slicer(readStream)
    this.position = 0
    this.promise = null
  }

  get isDepleted () {
    return !this.slicer.readable
  }

  // length = -1 means 'until the end'
  async readChunk (length, label) {
    const _this = this
    if (this.promise !== null) {
      throw new Error('pomise already there !!!', this.promise)
    }
    if (length === -1) {
      const chunks = []
      let error = false
      do {
        const res = await new Promise((resolve, reject) => {
          this.slicer.read(chunkSize, (error, length, data, offset) => {
            if (error !== false && error !== true) {
              reject(error)
            } else {
              resolve({error, data})
            }
          })
        })
        error = res.error
        chunks.push(res.data)
      } while (error === false)
      return Buffer.concat(chunks)
    } else {
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
}
