import { deprecate } from 'util'

import { getUserPublicProperties } from '../utils'
import { invalidCredentials } from 'xo-common/api-errors'

// ===================================================================

export async function signIn (credentials) {
  const user = await this.authenticateUser(credentials)
  if (!user) {
    throw invalidCredentials()
  }
  this.session.set('user_id', user.id)

  return getUserPublicProperties(user)
}

signIn.description = 'sign in'

// -------------------------------------------------------------------

export const signInWithPassword = deprecate(
  signIn,
  'use session.signIn() instead'
)

signInWithPassword.params = {
  email: { type: 'string' },
  password: { type: 'string' },
}

// -------------------------------------------------------------------

export const signInWithToken = deprecate(signIn, 'use session.signIn() instead')

signInWithToken.params = {
  token: { type: 'string' },
}

// -------------------------------------------------------------------

export function signOut () {
  this.session.unset('user_id')
}

signOut.description = 'sign out the user from the current session'

// This method requires the user to be signed in.
signOut.permission = ''

// -------------------------------------------------------------------

export async function getUser () {
  const userId = this.session.get('user_id')

  return userId === undefined
    ? null
    : getUserPublicProperties(await this.getUser(userId))
}

getUser.description = 'return the currently connected user'
