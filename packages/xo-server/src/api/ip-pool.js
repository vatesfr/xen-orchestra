export function create(props) {
  return this.createIpPool(props)
}

create.permission = 'admin'
create.description = 'Creates a new ipPool'

// -------------------------------------------------------------------

function delete_({ id }) {
  return this.deleteIpPool(id)
}
export { delete_ as delete }

delete_.permission = 'admin'
delete_.description = 'Delete an ipPool'

// -------------------------------------------------------------------

export function getAll(params) {
  const { user } = this

  return this.getAllIpPools(user.permission === 'admin' ? params && params.userId : user.id)
}

getAll.description = 'List all ipPools'

// -------------------------------------------------------------------

export function set({ id, ...props }) {
  return this.updateIpPool(id, props)
}

set.permission = 'admin'
set.description = 'Allow to modify an existing ipPool'
