'use strict'

const { describe, it } = require('node:test')
const assert = require('assert')

const UnknownFormatError = require('./_unknown-format-error')
const { unserialize } = require('./_serializers')

// ===================================================================

describe('serializers', function () {
  describe('#unserialize()', function () {
    it('throws UnknownFormatError for unrecognized extensions', function () {
      assert.throws(
        () => unserialize({ path: '/config.xyz', content: '' }),
        err => err instanceof UnknownFormatError
      )
    })

    it('wraps parse errors with the file path', function () {
      assert.throws(
        () => unserialize({ path: '/config.json', content: '{ invalid' }),
        err => {
          assert.match(err.message, /\/config\.json/)
          return true
        }
      )
    })

    it('preserves the original parse error as cause', function () {
      assert.throws(
        () => unserialize({ path: '/config.json', content: '{ invalid' }),
        err => {
          assert.ok(err.cause instanceof SyntaxError)
          return true
        }
      )
    })
  })
})
