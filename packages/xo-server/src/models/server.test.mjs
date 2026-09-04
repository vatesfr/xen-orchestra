import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { serializeError } from '../utils.mjs'
import { Servers } from './server.mjs'

// Reproduces what a record goes through on its way to the database and back:
// `Collection#_add` copies it with JSON *before* the model serializes it, then
// redis stores and returns JSON
const throughDatabase = record => {
  const copy = JSON.parse(JSON.stringify(record))
  Servers.prototype._serialize(copy)

  const stored = JSON.parse(JSON.stringify(copy))
  Servers.prototype._unserialize(stored)
  return stored
}

const makeServer = error => ({ id: 'server-1', enabled: true, error, host: '192.0.2.1' })

describe('Servers', function () {
  describe('error', function () {
    it('does not survive the copy made by the collection when it is a raw Error', function () {
      // hence `serializeError` in `_connectXenServer`: `message`, `name` and
      // `stack` are not enumerable, JSON copies them away
      const { error } = throughDatabase(makeServer(new Error('this pool is already connected')))

      assert.equal(error?.message, undefined)
    })

    it('keeps its message and code once serialized by the caller', function () {
      const cause = new Error('SESSION_AUTHENTICATION_FAILED(, )')
      cause.code = 'SESSION_AUTHENTICATION_FAILED'

      const { error } = throughDatabase(makeServer(serializeError(cause)))

      assert.equal(error.message, 'SESSION_AUTHENTICATION_FAILED(, )')
      assert.equal(error.code, 'SESSION_AUTHENTICATION_FAILED')
      assert.equal(error.name, 'Error')
    })

    it('compares equal to a new occurrence of the same error, so a failing server is not rewritten', function () {
      // `_connectXenServer` skips the database write – and therefore any
      // reconnection attempt triggered by it – when the error did not change
      const previousError = throughDatabase(
        makeServer(serializeError(new Error('this pool is already connected')))
      ).error
      const currentError = serializeError(new Error('this pool is already connected'))

      assert.equal(previousError.code, currentError.code)
      assert.equal(previousError.message, currentError.message)
    })
  })
})
