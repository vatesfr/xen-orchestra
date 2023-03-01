import { deprecate } from 'util'

import { getUserPublicProperties } from '../utils.mjs'

// ===================================================================

export async function signIn(credentials) {
  const { connection } = this.apiContext

  const { user, expiration } = await this.authenticateUser(credentials, {
    ip: connection.get('user_ip', undefined),
  })

  connection.set('user_id', user.id)

  if (expiration === undefined) {
    connection.unset('expiration')
  } else {
    connection.set('expiration', expiration)
  }

  return getUserPublicProperties(user)
}

signIn.description = 'sign in'
signIn.permission = null // user does not need to be authenticated

// -------------------------------------------------------------------

export const signInWithPassword = deprecate(signIn, 'use session.signIn() instead')

signInWithPassword.params = {
  email: { type: 'string' },
  password: { type: 'string' },
}
signInWithPassword.permission = null // user does not need to be authenticated

// -------------------------------------------------------------------

export const signInWithToken = deprecate(signIn, 'use session.signIn() instead')

signInWithToken.params = {
  token: { type: 'string' },
}
signInWithToken.permission = null // user does not need to be authenticated

// -------------------------------------------------------------------

export function signOut() {
  this.apiContext.connection.unset('user_id')
}

signOut.description = 'sign out the user from the current session'

// -------------------------------------------------------------------

export async function getUser() {
  const userId = this.apiContext.user.id

  return userId === undefined ? null : getUserPublicProperties(await this.getUser(userId))
}

getUser.description = 'return the currently connected user'
getUser.permission = null // user does not need to be authenticated
