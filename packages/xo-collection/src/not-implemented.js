import { BaseError } from 'make-error'

export default class NotImplemented extends BaseError {
  constructor(message) {
    super(message || 'this method is not implemented')
  }
}
