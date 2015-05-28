export async function get () {
  return await this.getAllAcls()
}

get.permission = 'admin'

get.description = 'get existing ACLs'

// -------------------------------------------------------------------

export async function getCurrent () {
  return await this.getAclsForUser(this.session.get('user_id'))
}

getCurrent.permission = ''

getCurrent.description = 'get existing ACLs concerning current user'

// -------------------------------------------------------------------

export async function add ({subject, object, action = 'view'}) {
  await this.addAcl(subject, object, action)
}

add.permission = 'admin'

add.params = {
  subject: { type: 'string' },
  object: { type: 'string' },
  // action: { type: 'string' }
}

add.description = 'add a new ACL entry'

// -------------------------------------------------------------------

export async function remove ({subject, object, action}) {
  await this.removeAcl(subject, object, action)
}

remove.permission = 'admin'

remove.params = {
  subject: { type: 'string' },
  object: { type: 'string' },
  action: { type: 'string' }
}

remove.description = 'remove an existing ACL entry'
