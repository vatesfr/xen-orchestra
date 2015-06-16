/* eslint-env mocha */

// Doc: https://github.com/moll/js-must/blob/master/doc/API.md#must
import expect from 'must'

// ===================================================================

import {getConnection} from './util.js'

// ===================================================================

describe('token', function () {
  let xo
  before(async function () {
    xo = await getConnection()
  })

  // TODO : delete tokens afterEach

  // =================================================================

  describe('.create ()', function () {

    it('creates a token string which can be used to sign in', async function () {
      const token = await xo.call('token.create')

      await getConnection({credentials: {token}})
    })
  })

  describe('.delete ()', function () {
    it('deletes a token', async function () {
      const token = await xo.call('token.create')
      const xo2 = await getConnection({credentials: {token}})

      await xo2.call('token.delete', {
        token
      })

      await getConnection({credentials: {token}}).then(
        function () {
          throw new Error('xo2.signIn should have thrown')
        },
        function (error) {
          expect(error.code).to.be.eql(3)
        })
    })
  })
})
