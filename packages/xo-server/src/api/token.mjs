// TODO: Prevent token connections from creating tokens.
// TODO: Token permission.
export async function create({ description, expiresIn }) {
  return (
    await this.createAuthenticationToken({
      description,
      expiresIn,
      userId: this.apiContext.user.id,
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

async function delete_({ pattern, tokens }) {
  await this.deleteAuthenticationTokens({ filter: pattern ?? { id: { __or: tokens } } })
}

export { delete_ as delete }

delete_.description = 'delete an existing authentication token'

delete_.params = {
  tokens: { type: 'array', optional: true, items: { type: 'string' } },
  pattern: { type: 'object', optional: true },
}

// -------------------------------------------------------------------

export async function set({ id, ...props }) {
  await this.updateAuthenticationToken({ id, user_id: this.apiContext.user.id }, props)
}

set.description = 'changes the properties of an existing token'

set.params = {
  description: { type: ['null', 'string'], minLength: 0, optional: true },
  id: { type: 'string' },
}
