import { BaseError } from 'make-error'
import { isArray, iteratee } from 'lodash'

class XoError extends BaseError {
  constructor ({ code, message, data }) {
    super(message)
    this.code = code
    this.data = data
  }

  toJsonRpcError () {
    return {
      message: this.message,
      code: this.code,
      data: this.data
    }
  }
}

const create = (code, getProps) => {
  const factory = args => new XoError({ ...getProps(args), code })
  factory.is = (error, predicate) =>
    error.code === code && iteratee(predicate)(error)

  return factory
}

// =============================================================================

export const notImplemented = create(0, () => ({
  message: 'not implemented'
}))

export const noSuchObject = create(1, (id, type) => ({
  data: { id, type },
  message: 'no such object'
}))

export const unauthorized = create(2, () => ({
  message: 'not authenticated or not enough permissions'
}))

export const invalidCredentials = create(3, () => ({
  message: 'invalid credentials'
}))

// Deprecated alreadyAuthenticated (4)

export const forbiddenOperation = create(5, (operation, reason) => ({
  data: { operation, reason },
  message: `forbidden operation: ${operation}`
}))

// Deprecated GenericError (6)

export const noHostsAvailable = create(7, () => ({
  message: 'no hosts available'
}))

export const authenticationFailed = create(8, () => ({
  message: 'authentication failed'
}))

export const hostUnreached = create(9, id => ({
  data: { id },
  message: 'host unreached'
}))

export const invalidParameters = create(10, (message, errors) => {
  if (isArray(message)) {
    errors = message
    message = undefined
  }

  return {
    data: { errors },
    message: message || 'invalid parameters'
  }
})
