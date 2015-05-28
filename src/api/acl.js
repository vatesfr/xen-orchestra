export async function get () {
  return await this.getAllAcls()
}

get.permission = 'admin'

get.description = 'get existing ACLs'

// -------------------------------------------------------------------

export async function getCurrent () {
  return await this.getAclsForSubject(this.session.get('user_id'))
}

getCurrent.permission = ''

getCurrent.description = 'get existing ACLs concerning current user'

// -------------------------------------------------------------------

export async function add ({subject, object, role}) {
  await this.addAcl(subject, object, role)
}

add.permission = 'admin'

add.params = {
  subject: { type: 'string' },
  object: { type: 'string' }
}

add.description = 'add a new ACL entry'

// -------------------------------------------------------------------

export async function remove ({subject, object, role}) {
  await this.removeAcl(subject, object, role)
}

remove.permission = 'admin'

remove.params = {
  subject: { type: 'string' },
  object: { type: 'string' }
}

remove.description = 'remove an existing ACL entry'
