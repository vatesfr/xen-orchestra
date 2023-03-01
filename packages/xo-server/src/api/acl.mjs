export async function get() {
  return /* await */ this.getAllAcls()
}

get.permission = 'admin'

get.description = 'get existing ACLs'

// -------------------------------------------------------------------

export async function getCurrentPermissions() {
  return /* await */ this.getPermissionsForUser(this.apiContext.user.id)
}

getCurrentPermissions.description = 'get (explicit) permissions by object for the current user'

// -------------------------------------------------------------------

export async function add({ subject, object, action }) {
  await this.addAcl(subject, object, action)
}

add.permission = 'admin'

add.params = {
  subject: { type: 'string' },
  object: { type: 'string' },
  action: { type: 'string' },
}

add.description = 'add a new ACL entry'

// -------------------------------------------------------------------

export async function remove({ subject, object, action }) {
  await this.removeAcl(subject, object, action)
}

remove.permission = 'admin'

remove.params = {
  subject: { type: 'string' },
  object: { type: 'string' },
  action: { type: 'string' },
}

remove.description = 'remove an existing ACL entry'
