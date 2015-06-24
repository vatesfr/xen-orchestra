/* eslint-env mocha */

// Doc: https://github.com/moll/js-must/blob/master/doc/API.md#must
import expect from 'must'

// ===================================================================

import {getConnection, getUser, createUser, deleteUsers} from './util.js'
import {map, find} from 'lodash'

// ===================================================================

describe('group', function () {
  let xo
  let userIds = []
  let groupIds = []
  before(async function () {
    xo = await getConnection()
  })

  afterEach(async function () {
    await deleteGroups()
    await deleteUsers(xo, userIds)
    userIds = []
  })

  async function createGroup (params) {
    const groupId = await xo.call('group.create', params)
    groupIds.push(groupId)
    return groupId
  }

  async function deleteGroups () {
    await Promise.all(map(
      groupIds,
      groupId => xo.call('group.delete', {id: groupId})
    ))
    groupIds = []
  }

  function compareGroup (actual, expected) {
    expect(actual.name).to.equal(expected.name)
    expect(actual.id).to.equal(expected.id)
    expect(actual.users).to.be.a.permutationOf(expected.users)
  }

  async function getAllGroups () {
    return await xo.call('group.getAll')
  }

  async function getGroup (id) {
    const groups = await getAllGroups()

    return find(groups, {id: id})
  }

  // =================================================================
  describe('.create()', function () {

    it('creates a group and return its id', async function () {
      const groupId = await createGroup({
        name: 'Avengers'
      })
      const group = await getGroup(groupId)

      compareGroup(group, {
        id: groupId,
        name: 'Avengers',
        users: []
      })
    })

    it.skip('does not create two groups with the same name', async function () {
      await createGroup({
        name: 'Avengers'
      })

      await createGroup({
        name: 'Avengers'
      }).then(
        function () {
          throw new Error('createGroup() should have thrown')
        },
        function (error) {
          expect(error.message).to.match(/duplicate group/i)
        }
      )
    })
  })

 // ------------------------------------------------------------------

  describe('.delete()', function () {

    it('delete a group', async function () {
      const groupId = await createGroup({
        name: 'Avengers'
      })

      await xo.call('group.delete', {
        id: groupId
      })

      const group = await getGroup(groupId)
      expect(group).to.be.undefined()
    })

    it.skip('erase the group from user\'s groups list', async function () {
      const groupId = await createGroup({
        name: 'Avengers'
      })

      const userId = await createUser(
        xo, userIds, {
          email: 'tony.stark@stark_industry.com',
          password: 'IronMan'
      })

      await xo.call('group.addUser', {
        id: groupId,
        userId: userId
      })

      await xo.call('group.delete', {id: groupId})
      const user = await getUser(xo, userId)
      expect(user.groups).to.be.a.permutationOf([])
    })

    it.skip('erase the user from group\'s users list', async function () {
      const groupId = await createGroup({
        name: 'Avengers'
      })

      const userId = await createUser(
        xo, userIds, {
          email: 'tony.stark@stark_industry.com',
          password: 'IronMan'
      })

      await xo.call('group.addUser', {
        id: groupId,
        userId: userId
      })

      await xo.call('user.delete', {id: userId})
      const group = await getGroup(groupId)
      expect(group.users).to.be.a.permutationOf([])
    })
  })

// -------------------------------------------------------------------

  describe('.getAll()', function () {

    it('returns an array', async function () {
      const groups = await xo.call('group.getAll')

      expect(groups).to.be.an.array()
    })
  })

// -------------------------------------------------------------------

  describe('.setUsers ()', function () {
    this.timeout(30e3)
    it('can set users of a group', async function () {
      const [groupId, userId1, userId2, userId3] = await Promise.all([
        createGroup({
          name: 'Avengers'
        }),
        createUser(xo, userIds, {
          email: 'tony.stark@stark_industry.com',
          password: 'IronMan'
        }),
        createUser(xo, userIds, {
          email: 'natasha.romanov@shield.com',
          password: 'BlackWidow'
        }),
        createUser(xo, userIds, {
          email: 'pietro.maximoff@shield.com',
          password: 'QickSilver'
        })
      ])

      await xo.call('group.setUsers', {
        id: groupId,
        userIds: [userId1, userId2]
      })

      {
        const [group, user1, user2, user3] = await Promise.all([
          getGroup(groupId),
          getUser(xo, userId1),
          getUser(xo, userId2),
          getUser(xo, userId3)
        ])

        compareGroup(group, {
          id: groupId,
          name: 'Avengers',
          users: [userId1, userId2]
        })

        expect(user1.groups).to.be.a.permutationOf([groupId])
        expect(user2.groups).to.be.a.permutationOf([groupId])
        expect(user3.groups).to.be.a.permutationOf([])
      }

      await xo.call('group.setUsers', {
        id: groupId,
        userIds: [userId1, userId3]
      })

      {
        const [group, user1, user2, user3] = await Promise.all([
          getGroup(groupId),
          getUser(xo, userId1),
          getUser(xo, userId2),
          getUser(xo, userId3)
        ])

        compareGroup(group, {
          id: groupId,
          name: 'Avengers',
          users: [userId1, userId3]
        })

        expect(user1.groups).to.be.a.permutationOf([groupId])
        expect(user2.groups).to.be.a.permutationOf([])
        expect(user3.groups).to.be.a.permutationOf([groupId])
      }
    })
  })

// -------------------------------------------------------------------

  describe('.addUser()', function () {
    this.timeout(30e3)
    it('adds a user id to a group', async function () {
      const groupId = await createGroup({
        name: 'Avengers'
      })

      const userId = await createUser(xo, userIds, {
        email: 'tony.stark@stark_industry.com',
        password: 'IronMan'
      })

      await xo.call('group.addUser', {
        id: groupId,
        userId: userId
      })

      const group = await getGroup(groupId)
      const user = await getUser(xo, userId)

      compareGroup(group, {
        id: groupId,
        name: 'Avengers',
        users: [userId]
      })

      expect(user.groups).to.be.a.permutationOf([groupId])

    })
  })

// -------------------------------------------------------------------

  describe('removeUser()', function () {

    it('removes a user to a group', async function () {
      const groupId = await createGroup({
        name: 'Avengers'
      })

      const userId = await createUser(xo, userIds, {
        email: 'tony.stark@stark_industry.com',
        password: 'IronMan'
      })

      await xo.call('group.addUser', {
        id: groupId,
        userId: userId
      })

      await xo.call('group.removeUser', {
        id: groupId,
        userId: userId
      })

      const group = await getGroup(groupId)
      const user = await getUser(xo, userId)

      compareGroup(group, {
        id: groupId,
        name: 'Avengers',
        users: []
      })

      expect(user.groups).to.be.a.permutationOf([])
    })
  })

// -------------------------------------------------------------------

  describe('set()', function () {
    it('changes name of a group', async function () {
      const groupId = await createGroup({
        name: 'Avengers'
      })

      await xo.call('group.set', {
        id: groupId,
        name: 'Guardians of the Galaxy'
      })

      const group = await getGroup(groupId)

      compareGroup(group, {
        id: groupId,
        name: 'Guardians of the Galaxy',
        users: []
      })
    })
  })
})
