import assert from 'assert/strict'
import test from 'node:test'
import { applySchema } from './config.schema.mjs'

const { describe, it } = test

describe('applySchema()', function () {
  it('redacts sensitive values', function () {
    const input = {
      http: {
        sessionSecret: 'super-secret-value',
      },
    }

    const result = applySchema(input)

    assert.deepEqual(result, {
      http: {
        sessionSecret: '**REDACTED**',
      },
    })
  })

  it('keeps safe values', function () {
    const input = {
      http: {
        port: 8080,
      },
    }

    const result = applySchema(input)

    assert.deepEqual(result, {
      http: {
        port: 8080,
      },
    })
  })

  it('redacts unknonw keys that are not in schema', function () {
    const input = {
      unknownFeature: {
        password: 'secret',
      },
    }

    const result = applySchema(input)

    assert.deepEqual(result, {
      unknownFeature: '**REDACTED**',
    })
  })

  it('accepts partial configuration', function () {
    const input = {
      redis: {
        socket: '/tmp/redis.sock',
      },
    }

    const result = applySchema(input)

    assert.deepEqual(result, {
      redis: {
        socket: '/tmp/redis.sock',
      },
    })
  })

  it('return empty object for an empty configuration', function () {
    assert.deepEqual({}, {})
  })
})
