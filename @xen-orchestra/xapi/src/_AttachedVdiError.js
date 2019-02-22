const BaseError = require('make-error')

module.exports = class AttachedVdiError extends BaseError {
  constructor() {
    super('this VDI is currently attached')
  }
}
