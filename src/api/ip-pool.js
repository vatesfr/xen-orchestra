export function create (props) {
  return this.createIpPool(props)
}

create.permission = 'admin'

// -------------------------------------------------------------------

function delete_ ({ id }) {
  return this.deleteIpPool(id)
}
export { delete_ as delete }

delete_.permission = 'admin'

// -------------------------------------------------------------------

export function getAll () {
  return this.getAllIpPools()
}

getAll.permission = 'admin'

// -------------------------------------------------------------------

export function set ({ id, ...props }) {
  return this.updateIpPool(id, props)
}

set.permission = 'admin'
