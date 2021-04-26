import { forbiddenOperation } from 'xo-common/api-errors.js'

export async function create({ name }) {
  return (await this.createGroup({ name })).id
}

create.description = 'creates a new group'
create.permission = 'admin'
create.params = {
  name: { type: 'string' },
}

// -------------------------------------------------------------------

// Deletes an existing group.
async function delete_({ id }) {
  await this.deleteGroup(id)
}

// delete is not a valid identifier.
export { delete_ as delete }

delete_.description = 'deletes an existing group'
delete_.permission = 'admin'
delete_.params = {
  id: { type: 'string' },
}

// -------------------------------------------------------------------

export async function getAll() {
  return /* await */ this.getAllGroups()
}

getAll.description = 'returns all the existing group'
getAll.permission = 'admin'

// -------------------------------------------------------------------

// sets group.users with an array of user ids
export async function setUsers({ id, userIds }) {
  await this.setGroupUsers(id, userIds)
}

setUsers.description = 'sets the users belonging to a group'
setUsers.permission = 'admin'
setUsers.params = {
  id: { type: 'string' },
  userIds: {},
}

// -------------------------------------------------------------------

// adds the user id to group.users
export async function addUser({ id, userId }) {
  const group = await this.getGroup(id)
  if (group.provider !== undefined) {
    throw forbiddenOperation('add user', 'cannot add user to synchronized group')
  }
  await this.addUserToGroup(userId, id)
}

addUser.description = 'adds a user to a group'
addUser.permission = 'admin'
addUser.params = {
  id: { type: 'string' },
  userId: { type: 'string' },
}

// -------------------------------------------------------------------

// remove the user id from group.users
export async function removeUser({ id, userId }) {
  const group = await this.getGroup(id)
  if (group.provider !== undefined) {
    throw forbiddenOperation('remove user', 'cannot remove user from synchronized group')
  }
  await this.removeUserFromGroup(userId, id)
}

// -------------------------------------------------------------------

removeUser.description = 'removes a user from a group'
removeUser.permission = 'admin'
removeUser.params = {
  id: { type: 'string' },
  userId: { type: 'string' },
}

// -------------------------------------------------------------------

export async function set({ id, name }) {
  if (name !== undefined) {
    const group = await this.getGroup(id)
    if (group.provider !== undefined) {
      throw forbiddenOperation('set group name', 'cannot edit synchronized group')
    }
  }
  await this.updateGroup(id, { name })
}

set.description = 'changes the properties of an existing group'
set.permission = 'admin'
set.params = {
  id: { type: 'string' },
  name: { type: 'string', optional: true },
}
