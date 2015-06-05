import {JsonRpcError} from 'json-rpc-protocol'

// ===================================================================

// Export standard JSON-RPC errors.
export {
  InvalidJson,
  InvalidParameters,
  InvalidRequest,
  MethodNotFound
} from 'json-rpc-protocol'

// -------------------------------------------------------------------

export class NotImplemented extends JsonRpcError {
  constructor () {
    super('not implemented', 0)
  }
}

// -------------------------------------------------------------------

export class NoSuchObject extends JsonRpcError {
  constructor (id, type) {
    super('no such object', 1, {id, type})
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
