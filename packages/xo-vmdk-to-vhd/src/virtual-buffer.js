'use strict'

import {Slicer} from 'pipette'

const chunkSize = 1024 * 1024

export class VirtualBuffer {
  constructor (readStream) {
    this.slicer = new Slicer(readStream)
    this.position = 0
  }

  get isDepleted () {
    return !this.slicer.readable
  }

  // length = -1 means 'until the end'
  async readChunk (length) {
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
      return new Promise((resolve, reject) => {
        this.slicer.read(length, (error, length, data, offset) => {
          this.position = offset + length
          if (error !== false && error !== true) {
            reject(error)
          } else {
            resolve(data)
          }
        })
      })
    }
  }
}
