'use strict'

// Minimal XO API mock for auth plugin integration tests.
//
// Covers the surface used by LDAP (and most of what SAML/OIDC need):
//   - registerUser2 / getAllUsers
//   - group CRUD
//   - registerAuthenticationProvider / addApiMethods  (LDAP)
//   - registerPassportStrategy stub                   (SAML, OIDC, GitHub)
//
// Extend per-plugin by spreading the result:
//   const xo = { ...createXoMock(), httpRequest: myFetch }

function createXoMock() {
  const users = new Map()
  const groups = new Map()
  let nextId = 1

  return {
    // Exposed for test assertions
    users,
    groups,

    // LDAP-specific
    registerAuthenticationProvider() {},
    addApiMethods() {
      return () => {}
    },

    // Passport-based plugins (SAML, OIDC, GitHub) stub
    registerPassportStrategy(_name, _strategy, _verify) {
      return () => {}
    },

    async registerUser2(provider, { user: { id, name } }) {
      const existing = [...users.values()].find(u => u.authProviders?.[provider]?.id === id)
      if (existing) return existing
      const xoUser = { id: `xo-${nextId++}`, name, authProviders: { [provider]: { id } } }
      users.set(xoUser.id, xoUser)
      return xoUser
    },

    async getAllUsers() {
      return [...users.values()]
    },

    async getAllGroups() {
      return [...groups.values()]
    },

    async createGroup({ name, provider, providerGroupId }) {
      const group = { id: `grp-${nextId++}`, name, provider, providerGroupId, users: [] }
      groups.set(group.id, group)
      return group
    },

    async updateGroup(id, { name }) {
      groups.get(id).name = name
    },

    async getGroup(id) {
      return groups.get(id)
    },

    async addUserToGroup(userId, groupId) {
      const group = groups.get(groupId)
      if (!group.users.includes(userId)) group.users.push(userId)
    },

    async removeUserFromGroup(userId, groupId) {
      const group = groups.get(groupId)
      group.users = group.users.filter(id => id !== userId)
    },

    async deleteGroup(id) {
      groups.delete(id)
    },
  }
}

module.exports = { createXoMock }
