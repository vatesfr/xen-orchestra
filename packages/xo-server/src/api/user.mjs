import isEmpty from 'lodash/isEmpty.js'
import { forbiddenOperation, invalidParameters } from 'xo-common/api-errors.js'
import { getUserPublicProperties } from '../utils.mjs'

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
  if (id === this.apiContext.user.id) {
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
  return users.map(getUserPublicProperties)
}

getAll.description = 'returns all the existing users'

getAll.permission = 'admin'

// -------------------------------------------------------------------

export function getAuthenticationTokens() {
  return this.getAuthenticationTokensForUser(this.apiContext.user.id)
}

getAuthenticationTokens.description = 'returns authentication tokens of the current user'

// -------------------------------------------------------------------

export async function set({ id, email, password, permission, preferences }) {
  const isAdmin = this.apiContext.permission === 'admin'
  if (isAdmin) {
    if (permission && id === this.apiContext.user.id) {
      throw invalidParameters('a user cannot change its own permission')
    }
  } else if (email || password || permission) {
    throw invalidParameters('this properties can only changed by an administrator')
  }

  const user = await this.getUser(id)
  if (!isEmpty(user.authProviders) && (email !== undefined || password !== undefined)) {
    throw forbiddenOperation('set password', 'cannot change the email or password of synchronized user')
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
  const { user } = this.apiContext

  if (!isEmpty(user.authProviders)) {
    throw forbiddenOperation('change password', 'synchronized users cannot change their passwords')
  }

  await this.changeUserPassword(user.id, oldPassword, newPassword)
}

changePassword.description = 'change password after checking old password (user function)'

changePassword.params = {
  oldPassword: { type: 'string' },
  newPassword: { type: 'string' },
}
