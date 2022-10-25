'use strict'
class BrokenVhdError extends Error {
  constructor(message, baseError) {
    super(message)
    this.code = 'BROKEN_VHD'
    this.cause = baseError
  }
}

module.exports = BrokenVhdError
