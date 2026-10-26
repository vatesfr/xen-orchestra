import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { V2V_ERROR_CODE } from '@vates/types'

import { ApiError } from '../helpers/error.helper.mjs'
import type { RestApi } from '../rest-api/rest-api.mjs'
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

describe('V2vService#getInventory', function () {
  function createService(getEsxiInventory: () => Promise<never>) {
    return new V2vService({ xoApp: { getEsxiInventory } } as unknown as RestApi)
  }

  it('rejects refused credentials with a 422, not a 401 which would open the browser prompt', async function () {
    const loginError = Object.assign(new Error('Cannot complete login'), { code: 'InvalidLogin' })
    const service = createService(() => Promise.reject(loginError))

    await assert.rejects(service.getInventory({ ...connection, host: 'vc' }), error => {
      assert(error instanceof ApiError)
      assert.equal(error.status, 422)
      assert.deepEqual(error.data, { code: V2V_ERROR_CODE.INVALID_CREDENTIALS, host: 'vc' })
      assert.equal(error.cause, loginError)
      return true
    })
  })

  it('lets the other errors through', async function () {
    const networkError = Object.assign(new Error('connect ECONNREFUSED'), { code: 'ECONNREFUSED' })
    const service = createService(() => Promise.reject(networkError))

    await assert.rejects(service.getInventory({ ...connection, host: 'vc' }), networkError)
  })
})
