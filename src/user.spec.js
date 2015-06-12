/* eslint-env mocha */

// Doc: https://github.com/moll/js-must/blob/master/doc/API.md#must
import expect from 'must'

// ===================================================================

import {find} from 'lodash'
import {Xo} from 'xo-lib'

// ===================================================================

describe('user', function () {
  let xo
  before(async function () {
    xo = new Xo('localhost:9000')

    await xo.signIn({
      email: 'admin@admin.net',
      password: 'admin'
    })
  })

  async function getAllUsers () {
    return await xo.call('user.getAll')
  }

  async function getUser (id) {
    const users = await getAllUsers()

    return find(users, {id: id})
  }

  // =================================================================

  describe('.create()', function () {
    it('creates an user and returns its id', async function () {
      const userId = await xo.call('user.create', {
        email: 'barbara@vates.fr',
        password: 'barbie'
      })

      expect(userId).to.be.a.string()

      const user = await getUser(userId)
      expect(user).to.be.eql({
        id: userId,
        email: 'barbara@vates.fr',
        groups: [],
        permission: 'none'
      })
    })
  })

  // -----------------------------------------------------------------

  describe('.delete()', function () {})

  // -----------------------------------------------------------------

  describe('.getAll()', function () {})

  // -----------------------------------------------------------------

  describe('.set()', function () {})
})
