import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { parseBasicCredentials } from './basic-auth.helper.mjs'

const encode = (value: string) => Buffer.from(value).toString('base64')

describe('parseBasicCredentials()', () => {
  it('splits username and password', () => {
    assert.deepEqual(parseBasicCredentials(encode('user:pass')), { username: 'user', password: 'pass' })
  })

  it('keeps colons found in the password', () => {
    assert.deepEqual(parseBasicCredentials(encode('user:a:b')), { username: 'user', password: 'a:b' })
    assert.deepEqual(parseBasicCredentials(encode('user::')), { username: 'user', password: ':' })
  })

  it('supports an empty password', () => {
    assert.deepEqual(parseBasicCredentials(encode('user:')), { username: 'user', password: '' })
  })

  it('has no password when there is no colon', () => {
    assert.deepEqual(parseBasicCredentials(encode('user')), { username: 'user', password: undefined })
  })
})
