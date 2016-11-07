import { unauthorized } from 'xo-common/api-errors'

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

export function getAll (params) {
  const { user } = this

  if (!user) {
    throw unauthorized()
  }

  return this.getAllIpPools(user.permission === 'admin'
    ? params && params.userId
    : user.id
  )
}

// -------------------------------------------------------------------

export function set ({ id, ...props }) {
  return this.updateIpPool(id, props)
}

set.permission = 'admin'
