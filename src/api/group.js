// FIXME All methods are to implement

export async function create ({name}) {
  return Date.now() // Dummy id
}

create.description = 'creates a new group'
create.permission = 'admin'
create.params = {
  name: {type: 'string'}
}

// Deletes an existing group.
async function delete_ ({id}) {
  return true
}

// delete is not a valid identifier.
export {delete_ as delete}

delete_.description = 'deletes an existing group'
delete_.permission = 'admin'
delete_.params = {
  id: {type: 'string'}
}

export async function getAll () {
  return [
    {
      id: 'G1',
      name: 'Groupe 1',
      users: []
    },
    {
      id: 'G2',
      name: 'Groupe 2',
      users: []
    }
  ]
}

delete_.description = 'returns all the existing group'
delete_.permission = 'admin'
delete_.params = {
  id: {type: 'string'}
}

// sets group.users with an array of user ids
export async function setUsers ({id, userIds}) {
  return true
}

setUsers.description = 'sets the users belonging to a group'
setUsers.permission = 'admin'
setUsers.params = {
  id: {type: 'string'},
  userIds: {}
}

// adds the user id to group.users
export async function addUser ({id, userId}) {
  return true
}

addUser.description = 'adds a user to a group'
addUser.permission = 'admin'
addUser.params = {
  id: {type: 'string'},
  userId: {type: 'string'}
}

// remove the user id from group.users
export async function removeUser ({id, userId}) {
  return true
}

removeUser.description = 'removes a user from a group'
removeUser.permission = 'admin'
removeUser.params = {
  id: {type: 'string'},
  userId: {type: 'string'}
}

export async function set ({id, name}) {
  return true
}

set.description = 'changes the properties of an existing group'
set.permission = 'admin'
set.params = {
  id: { type: 'string' },
  name: { type: 'string', optional: true }
}
