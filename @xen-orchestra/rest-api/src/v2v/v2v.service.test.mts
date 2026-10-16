import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { V2vService } from './v2v.service.mjs'

const connection = { username: 'user', password: 'password' }

describe('V2vService.toConnectionParams', function () {
  it('verifies the certificate unless asked not to', function () {
    assert.equal(V2vService.toConnectionParams({ ...connection, host: 'vc' }).sslVerify, true)
    assert.equal(V2vService.toConnectionParams({ ...connection, host: 'vc', skipSslCheck: true }).sslVerify, false)
  })

  it('adds the port to the host, unless it is the default one', function () {
    assert.equal(V2vService.toConnectionParams({ ...connection, host: ' vc ', port: 8443 }).host, 'vc:8443')
    assert.equal(V2vService.toConnectionParams({ ...connection, host: 'vc', port: 443 }).host, 'vc')
  })

  it('brackets an IPv6 address', function () {
    assert.equal(V2vService.toConnectionParams({ ...connection, host: 'fe80::1', port: 8443 }).host, '[fe80::1]:8443')
    assert.equal(V2vService.toConnectionParams({ ...connection, host: '[fe80::1]' }).host, '[fe80::1]')
  })

  it('renames the user', function () {
    assert.equal(V2vService.toConnectionParams({ ...connection, host: 'vc' }).user, 'user')
  })
})
