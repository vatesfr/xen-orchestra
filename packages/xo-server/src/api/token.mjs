// TODO: Prevent token connections from creating tokens.
// TODO: Token permission.
export async function create({ description, expiresIn }) {
  return (
    await this.createAuthenticationToken({
      description,
      expiresIn,
      userId: this.connection.get('user_id'),
    })
  ).id
}

create.description = 'create a new authentication token'

create.params = {
  description: {
    optional: true,
    type: 'string',
  },
  expiresIn: {
    optional: true,
    type: ['number', 'string'],
  },
}

// -------------------------------------------------------------------

// TODO: an user should be able to delete its own tokens.
async function delete_({ token: id }) {
  await this.deleteAuthenticationToken(id)
}

export { delete_ as delete }

delete_.description = 'delete an existing authentication token'

delete_.permission = 'admin'

delete_.params = {
  token: { type: 'string' },
}

// -------------------------------------------------------------------

export async function deleteAll({ except }) {
  await this.deleteAuthenticationTokens({
    filter: {
      user_id: this.connection.get('user_id'),
      id: {
        __not: except,
      },
    },
  })
}

deleteAll.description = 'delete all tokens of the current user except the current one'

deleteAll.params = {
  except: { type: 'string', optional: true },
}

// -------------------------------------------------------------------

export async function set({ id, ...props }) {
  await this.updateAuthenticationToken({ id, user_id: this.connection.get('user_id') }, props)
}

set.description = 'changes the properties of an existing token'

set.params = {
  description: { type: ['null', 'string'], optional: true },
  id: { type: 'string' },
}
