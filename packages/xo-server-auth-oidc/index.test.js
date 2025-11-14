'use strict'

const { beforeEach, describe, it, mock } = require('node:test')
const assert = require('node:assert/strict')

let mockData
let mockXo
let authOidc

beforeEach(() => {
  mockData = { xoGroups: [] }

  mockXo = {
    getAllGroups: mock.fn(async () => mockData.xoGroups),
    createGroup: mock.fn(async group => {
      const newGroup = { id: mockData.xoGroups.length + 1, users: [], ...group }
      mockData.xoGroups.push(newGroup)
      return newGroup
    }),
    addUserToGroup: mock.fn(async (userId, groupId) => {
      const group = mockData.xoGroups.find(g => g.id === groupId)
      if (!group) throw new Error(`Group ${groupId} not found`)
      if (!group.users.includes(userId)) group.users.push(userId)
    }),
  }

  authOidc = require('./index.js').default({ xo: mockXo })
})

describe('AuthOidc._synchronizeGroups', () => {
  it('synchronizeGroups should create the user groups and add the user', async () => {
    mockData.xoGroups = []
    const mockUser = { id: 'id1' }
    const mockOidcGroups = ['group-1', 'group-2']

    await authOidc._synchronizeGroups(mockUser, mockOidcGroups)

    // We created 2 groups and added 1 user to each.
    assert.equal(mockXo.createGroup.mock.calls.length, 2)
    assert.equal(mockXo.addUserToGroup.mock.calls.length, 2)

    assert.deepEqual(mockData.xoGroups, [
      { id: 1, users: ['id1'], name: 'group-1', provider: 'oidc' },
      { id: 2, users: ['id1'], name: 'group-2', provider: 'oidc' },
    ])
  })

  it('synchronizeGroups should not recreate existing groups but still add the user', async () => {
    mockData.xoGroups = [
      { id: 1, users: [], name: 'group-1', provider: 'oidc' },
      { id: 2, users: [], name: 'group-2', provider: 'oidc' },
    ]
    const mockUser = { id: 'id1' }
    const mockOidcGroups = ['group-1', 'group-2']

    await authOidc._synchronizeGroups(mockUser, mockOidcGroups)

    // We added 1 user to each group.
    assert.equal(mockXo.createGroup.mock.calls.length, 0)
    assert.equal(mockXo.addUserToGroup.mock.calls.length, 2)

    assert.deepEqual(mockData.xoGroups, [
      { id: 1, users: ['id1'], name: 'group-1', provider: 'oidc' },
      { id: 2, users: ['id1'], name: 'group-2', provider: 'oidc' },
    ])
  })
})
