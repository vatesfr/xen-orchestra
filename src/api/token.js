import {Unauthorized} from '../api-errors'

// ===================================================================

// TODO: Token permission.
export async function create () {
  // The user MUST not be signed with a token
  if (this.session.has('token_id')) {
    throw new Unauthorized()
  }

  const userId = this.session.get('user_id')
  return (await this.createAuthenticationToken({userId})).id
}

create.description = 'create a new authentication token'

create.permission = '' // sign in

// -------------------------------------------------------------------

async function delete_ ({token: id}) {
  await this.deleteAuthenticationToken(id)
}

export {delete_ as delete}

delete_.description = 'delete an existing authentication token'

delete_.permission = 'admin'

delete_.params = {
  token: { type: 'string' }
}
