import { invalidParameters } from 'xo-common/api-errors'
import { getUserPublicProperties, mapToArray } from '../utils'

// ===================================================================

export async function create({ email, password, permission }) {
  return (await this.createUser({ email, password, permission })).id
}

create.description = 'creates a new user'

create.permission = 'admin'

create.params = {
  email: { type: 'string' },
  password: { type: 'string' },
  permission: { type: 'string', optional: true },
}

// -------------------------------------------------------------------

// Deletes an existing user.
async function delete_({ id }) {
  if (id === this.session.get('user_id')) {
    throw invalidParameters('a user cannot delete itself')
  }

  await this.deleteUser(id)
}

// delete is not a valid identifier.
export { delete_ as delete }

delete_.description = 'deletes an existing user'

delete_.permission = 'admin'

delete_.params = {
  id: { type: 'string' },
}

// -------------------------------------------------------------------

// TODO: remove this function when users are integrated to the main
// collection.
export async function getAll() {
  // Retrieves the users.
  const users = await this.getAllUsers()

  // Filters out private properties.
  return mapToArray(users, getUserPublicProperties)
}

getAll.description = 'returns all the existing users'

getAll.permission = 'admin'

// -------------------------------------------------------------------

export async function set({ id, email, password, permission, preferences }) {
  const isAdmin = this.user && this.user.permission === 'admin'
  if (isAdmin) {
    if (permission && id === this.session.get('user_id')) {
      throw invalidParameters('a user cannot change its own permission')
    }
  } else if (email || password || permission) {
    throw invalidParameters('this properties can only changed by an administrator')
  }

  await this.updateUser(id, { email, password, permission, preferences })
}

set.description = 'changes the properties of an existing user'

set.params = {
  id: { type: 'string' },
  email: { type: 'string', optional: true },
  password: { type: 'string', optional: true },
  permission: { type: 'string', optional: true },
  preferences: { type: 'object', optional: true },
}

// -------------------------------------------------------------------

export async function changePassword({ oldPassword, newPassword }) {
  const id = this.session.get('user_id')
  await this.changeUserPassword(id, oldPassword, newPassword)
}

changePassword.description = 'change password after checking old password (user function)'

changePassword.params = {
  oldPassword: { type: 'string' },
  newPassword: { type: 'string' },
}
