/* eslint-env jest */

import { defer } from 'golike-defer'
import map from 'lodash/map.js'

import { getConnection, rejectionOf, testConnection, xo } from '../util.js'

// ===================================================================

describe('token', () => {
  const tokens = []

  afterAll(async () => {
    await Promise.all(map(tokens, token => xo.call('token.delete', { token })))
  })

  async function createToken() {
    const token = await xo.call('token.create')
    tokens.push(token)
    return token
  }

  // =================================================================

  describe('.create()', () => {
    it('creates a token string which can be used to sign in', async () => {
      const token = await createToken()

      await testConnection({ credentials: { token } })
    })
  })

  // -------------------------------------------------------------------

  describe('.delete()', () => {
    it(
      'deletes a token',
      defer(async $defer => {
        const token = await createToken()
        const xo2 = await getConnection({ credentials: { token } })
        $defer(() => xo2.close())

        await xo2.call('token.delete', {
          token,
        })

        expect((await rejectionOf(testConnection({ credentials: { token } }))).code).toBe(3)
      })
    )
  })
})
