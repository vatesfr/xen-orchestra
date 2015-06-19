/* eslint-env mocha */

// Doc: https://github.com/moll/js-must/blob/master/doc/API.md#must
import expect from 'must'

// ===================================================================

import {getConnection, getUser, createUser, deleteUsers} from './util'

// ===================================================================

describe('user', function () {
  let xo
  let userIds = []
  before(async function () {
    xo = await getConnection()
  })

  afterEach(async function () {
    await deleteUsers(xo, userIds)
    userIds = []
  })

  // =================================================================

  describe('.create()', function () {

    it('creates an user and returns its id', async function () {
      const userId = await createUser(xo, userIds, {
        email: 'wayne@vates.fr',
        password: 'batman'})

      expect(userId).to.be.a.string()

      const user = await getUser(xo, userId)
      expect(user).to.be.eql({
        id: userId,
        email: 'wayne@vates.fr',
        groups: [],
        permission: 'none'
      })
    })

    it.skip('does not create two users with the same email', async function () {
      await createUser(xo, userIds, {
        email: 'wayne@vates.fr',
        password: 'batman'
      })

      await createUser(xo, userIds, {
        email: 'wayne@vates.fr',
        password: 'alfred'
      }).then(
        function () {
          throw new Error('createUser() should have thrown')
        },
        function (error) {
          expect(error.message).to.match(/duplicate user/i)
        }
      )
    })

    it('can set the user permission', async function () {
      const userId = await createUser(xo, userIds, {
        email: 'wayne@vates.fr',
        password: 'batman',
        permission: 'admin'
      })

      const user = await getUser(xo, userId)
      expect(user).to.be.eql({
        id: userId,
        email: 'wayne@vates.fr',
        groups: [],
        permission: 'admin'
      })
    })

    it('allows the user to sign in', async function () {
      await createUser(xo, userIds, {
        email: 'wayne@vates.fr',
        password: 'batman'
      })

      await getConnection({credentials: {
        email: 'wayne@vates.fr',
        password: 'batman'
      }})
    })
  })

  // -----------------------------------------------------------------

  describe('.delete()', function () {

    it('deletes an user', async function () {
      const userId = await createUser(xo, userIds, {
        email: 'wayne@vates.fr',
        password: 'batman'
      })

      await xo.call('user.delete', {
        id: userId
      })
      const user = await getUser(xo, userId)
      expect(user).to.be.undefined()
    })

    it('not allows an user to delete itself', async function () {
      await xo.call('user.delete', {id: xo.user.id}).then(
        function () {
          throw new Error('user.delete() should have thrown')
        },
        function (error) {
          expect(error.data).to.equal('an user cannot delete itself')
        }
      )
    })
  })

  // -----------------------------------------------------------------

  describe('.getAll()', function () {
    it('returns an array', async function () {
      const users = await xo.call('user.getAll')

      expect(users).to.be.an.array()
    })
  })

  // -----------------------------------------------------------------

  describe('.set()', function () {

    it('changes password of an existing user', async function () {
      const userId = await createUser(xo, userIds, {
        email: 'wayne@vates.fr',
        password: 'batman'
      })

      await xo.call('user.set', {
        id: userId,
        password: 'alfred'
      })

      await getConnection({credentials: {
        email: 'wayne@vates.fr',
        password: 'alfred'
      }})
    })

    it('changes email adress of an existing user', async function () {
      const userId = await createUser(xo, userIds, {
        email: 'wayne@vates.fr',
        password: 'batman'
      })

      await xo.call('user.set', {
        id: userId,
        email: 'batman@vates.fr'
      })
      const user = await getUser(xo, userId)
      expect(user).to.be.eql({
        id: userId,
        email: 'batman@vates.fr',
        groups: [],
        permission: 'none'
      })
    })
  })
})
