/* eslint-env jest */

import { find, map } from 'lodash'

import { createUser, deleteUsers, getUser, xo } from './util.js'

// ===================================================================
describe('group', () => {
  const userIds = []
  const groupIds = []

  // -----------------------------------------------------------------

  afterEach(async () => {
    await Promise.all(map(groupIds, id => xo.call('group.delete', { id })))
    // Deleting users must be done AFTER deleting the group
    // because there is a race condition in xo-server
    // which cause some users to not be properly deleted.

    // The test “delete the group with its users” highlight this issue.
    await deleteUsers(xo, userIds)
    userIds.length = groupIds.length = 0
  })

  // -----------------------------------------------------------------

  async function createGroup(params) {
    const groupId = await xo.call('group.create', params)
    groupIds.push(groupId)
    return groupId
  }

  // ----------------------------------------------------------------

  function compareGroup(actual, expected) {
    expect(actual.name).toEqual(expected.name)
    expect(actual.id).toEqual(expected.id)
    expect(actual.users).toEqual(expected.users)
  }

  // ----------------------------------------------------------------

  function getAllGroups() {
    return xo.call('group.getAll')
  }

  // ---------------------------------------------------------------

  async function getGroup(id) {
    const groups = await getAllGroups()
    return find(groups, { id })
  }

  // =================================================================

  describe('.create()', () => {
    it('creates a group and return its id', async () => {
      const groupId = await createGroup({
        name: 'Avengers',
      })
      const group = await getGroup(groupId)
      compareGroup(group, {
        id: groupId,
        name: 'Avengers',
        users: [],
      })
    })

    it.skip('does not create two groups with the same name', async () => {
      await createGroup({
        name: 'Avengers',
      })

      await createGroup({
        name: 'Avengers',
      }).then(
        () => {
          throw new Error('createGroup() should have thrown')
        },
        function (error) {
          expect(error.message).to.match(/duplicate group/i)
        }
      )
    })
  })

  // ------------------------------------------------------------------

  describe('.delete()', () => {
    let groupId
    let userId1
    let userId2
    let userId3
    beforeEach(async () => {
      groupId = await xo.call('group.create', {
        name: 'Avengers',
      })
    })
    it('delete a group', async () => {
      await xo.call('group.delete', {
        id: groupId,
      })
      const group = await getGroup(groupId)
      expect(group).toBeUndefined()
    })

    it.skip("erase the group from user's groups list", async () => {
      // create user and add it to the group
      const userId = await createUser(xo, userIds, {
        email: 'tony.stark@stark_industry.com',
        password: 'IronMan',
      })
      await xo.call('group.addUser', {
        id: groupId,
        userId,
      })

      // delete the group
      await xo.call('group.delete', { id: groupId })
      const user = await getUser(userId)
      expect(user.groups).toEqual([])
    })

    it.skip("erase the user from group's users list", async () => {
      // create user and add it to the group
      const userId = await createUser(xo, userIds, {
        email: 'tony.stark@stark_industry.com',
        password: 'IronMan',
      })
      await xo.call('group.addUser', {
        id: groupId,
        userId,
      })

      // delete the group
      await xo.call('user.delete', { id: userId })
      const group = await getGroup(groupId)
      expect(group.users).toEqual([])
    })

    // FIXME: some users are not properly deleted because of a race condition with group deletion.
    it.skip('delete the group with its users', async () => {
      // create users
      ;[userId1, userId2, userId3] = await Promise.all([
        xo.call('user.create', {
          email: 'tony.stark@stark_industry.com',
          password: 'IronMan',
        }),
        xo.call('user.create', {
          email: 'natasha.romanov@shield.com',
          password: 'BlackWidow',
        }),
        xo.call('user.create', {
          email: 'pietro.maximoff@shield.com',
          password: 'QickSilver',
        }),
      ])

      await xo.call('group.setUsers', {
        id: groupId,
        userIds: [userId1, userId2, userId3],
      })

      // delete the group with his users
      await Promise.all([
        xo.call('group.delete', {
          id: groupId,
        }),
        deleteUsers(xo, [userId1, userId2, userId3]),
      ])

      const [group, user1, user2, user3] = await Promise.all([
        getGroup(groupId),
        getUser(xo, userId1),
        getUser(xo, userId2),
        getUser(xo, userId3),
      ])

      expect(group).toBeUndefined()
      expect(user1).toBeUndefined()
      expect(user2).toBeUndefined()
      expect(user3).toBeUndefined()
    })
  })

  // -------------------------------------------------------------------

  describe('.getAll()', () => {
    it('returns an array', async () => {
      const groups = await xo.call('group.getAll')
      expect(groups).toBeInstanceOf(Array)
    })
  })

  // -------------------------------------------------------------------

  describe('.setUsers ()', () => {
    let groupId
    let userId1
    let userId2
    let userId3
    beforeEach(async () => {
      ;[groupId, userId1, userId2, userId3] = await Promise.all([
        createGroup({
          name: 'Avengers',
        }),
        createUser(xo, userIds, {
          email: 'tony.stark@stark_industry.com',
          password: 'IronMan',
        }),
        createUser(xo, userIds, {
          email: 'natasha.romanov@shield.com',
          password: 'BlackWidow',
        }),
        createUser(xo, userIds, {
          email: 'pietro.maximoff@shield.com',
          password: 'QickSilver',
        }),
      ])
    })

    it('can set users of a group', async () => {
      // add two users on the group
      await xo.call('group.setUsers', {
        id: groupId,
        userIds: [userId1, userId2],
      })
      {
        const [group, user1, user2, user3] = await Promise.all([
          getGroup(groupId),
          getUser(xo, userId1),
          getUser(xo, userId2),
          getUser(xo, userId3),
        ])
        compareGroup(group, {
          id: groupId,
          name: 'Avengers',
          users: [userId1, userId2],
        })

        expect(user1.groups).toEqual([groupId])
        expect(user2.groups).toEqual([groupId])
        expect(user3.groups).toEqual([])
      }

      // change users of the group
      await xo.call('group.setUsers', {
        id: groupId,
        userIds: [userId1, userId3],
      })
      {
        const [group, user1, user2, user3] = await Promise.all([
          getGroup(groupId),
          getUser(xo, userId1),
          getUser(xo, userId2),
          getUser(xo, userId3),
        ])

        compareGroup(group, {
          id: groupId,
          name: 'Avengers',
          users: [userId1, userId3],
        })

        expect(user1.groups).toEqual([groupId])
        expect(user2.groups).toEqual([])
        expect(user3.groups).toEqual([groupId])
      }
    })
  })

  // -------------------------------------------------------------------

  describe('.addUser()', () => {
    let groupId
    let userId
    beforeEach(async () => {
      ;[groupId, userId] = await Promise.all([
        createGroup({
          name: 'Avengers',
        }),
        createUser(xo, userIds, {
          email: 'tony.stark@stark_industry.com',
          password: 'IronMan',
        }),
      ])
    })

    it('adds a user id to a group', async () => {
      await xo.call('group.addUser', {
        id: groupId,
        userId,
      })

      const [group, user] = await Promise.all([getGroup(groupId), getUser(xo, userId)])

      compareGroup(group, {
        id: groupId,
        name: 'Avengers',
        users: [userId],
      })

      expect(user.groups).toEqual([groupId])
    })
  })

  // -------------------------------------------------------------------

  describe('removeUser()', () => {
    let groupId
    let userId
    beforeEach(async () => {
      ;[groupId, userId] = await Promise.all([
        createGroup({
          name: 'Avengers',
        }),
        createUser(xo, userIds, {
          email: 'tony.stark@stark_industry.com',
          password: 'IronMan',
        }),
      ])

      await xo.call('group.addUser', {
        id: groupId,
        userId,
      })
    })

    it('removes a user to a group', async () => {
      await xo.call('group.removeUser', {
        id: groupId,
        userId,
      })

      const [group, user] = await Promise.all([getGroup(groupId), getUser(xo, userId)])

      compareGroup(group, {
        id: groupId,
        name: 'Avengers',
        users: [],
      })

      expect(user.groups).toEqual([])
    })
  })

  // -------------------------------------------------------------------

  describe('set()', () => {
    let groupId
    beforeEach(async () => {
      groupId = await createGroup({
        name: 'Avengers',
      })
    })

    it('changes name of a group', async () => {
      await xo.call('group.set', {
        id: groupId,
        name: 'Guardians of the Galaxy',
      })

      const group = await getGroup(groupId)
      compareGroup(group, {
        id: groupId,
        name: 'Guardians of the Galaxy',
        users: [],
      })
    })
  })
})
