import {JsonRpcError} from '@julien-f/json-rpc/errors'

// ===================================================================

// Export standard JSON-RPC errors.
export * from '@julien-f/json-rpc/errors'

// -------------------------------------------------------------------

export class NotImplemented extends JsonRpcError {
  constructor () {
    super('not implemented', 0)
  }
}

// -------------------------------------------------------------------

export class NoSuchObject extends JsonRpcError {
  constructor (data) {
    super('no such object', 1, data)
  }
}

// -------------------------------------------------------------------

export class Unauthorized extends JsonRpcError {
  constructor () {
    super('not authenticated or not enough permissions', 2)
  }
}

// -------------------------------------------------------------------

export class InvalidCredential extends JsonRpcError {
  constructor () {
    super('invalid credential', 3)
  }
}

// -------------------------------------------------------------------

export class AlreadyAuthenticated extends JsonRpcError {
  constructor () {
    super('already authenticated', 4)
  }
}
