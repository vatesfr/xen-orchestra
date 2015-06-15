/* eslint-env mocha */

// Doc: https://github.com/moll/js-must/blob/master/doc/API.md#must
import expect from 'must'

// ===================================================================

import {Xo} from 'xo-lib'

// ===================================================================

describe('token', function () {
  let xo
  before(async function () {
    xo = new Xo('localhost:9000')

    await xo.signIn({
      email: 'admin@admin.net',
      password: 'admin'
    })
  })

  // TODO : delete tokens afterEach

  // =================================================================

  describe('.create ()', function () {

    it('creates a token string which can be used to sign in', async function () {
      const token = await xo.call('token.create')

      const xo2 = new Xo('localhost:9000')
      await xo2.signIn({
        token: token
      })
    })
  })

  describe('.delete ()', function () {
    it('deletes a token', async function () {
      const token = await xo.call('token.create')
      const xo2 = new Xo('localhost:9000')
      await xo2.signIn({
        token: token
      })
      await xo2.call('token.delete', {
        token: token
      })
      await xo2.signIn({
        token: token
      }).then(
        function () {
          throw new Error('xo2.signIn should have thrown')
        },
        function (error) {
          expect(error.code).to.be.eql(3)
        })
    })
  })
})
