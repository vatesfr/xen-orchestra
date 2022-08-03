'use strict'

// TODO: remove when Node >=15.0
module.exports = class AggregateError extends Error {
  constructor(errors, message) {
    super(message)
    this.errors = errors
  }
}
