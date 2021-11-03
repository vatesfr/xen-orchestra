export function getAll() {
  return this.getAllCloudConfigs()
}

getAll.description = 'Gets all existing cloud configs templates'

export function getAllNetwork() {
  return this.getAllNetworkCloudConfigs()
}

getAllNetwork.description = 'Gets all existing network cloud configs templates'

export async function create(props) {
  return this.createCloudConfig(props)
}

create.permission = 'admin'
create.description = 'Creates a new cloud config template'
create.params = {
  name: { type: 'string' },
  template: { type: 'string' },
}

export function createNetwork(props) {
  return this.createCloudConfig({ ...props, type: 'network' })
}

createNetwork.permission = 'admin'
createNetwork.description = 'Creates a new network cloud config template'
createNetwork.params = {
  name: { type: 'string' },
  template: { type: 'string' },
}

export function update(props) {
  return this.updateCloudConfig(props)
}

update.permission = 'admin'
update.description = 'Modifies an existing cloud config template'
update.params = {
  id: { type: 'string' },
  name: { type: 'string', optional: true },
  template: { type: 'string', optional: true },
}

function delete_({ id }) {
  return this.deleteCloudConfig(id)
}

delete_.permission = 'admin'
delete_.description = 'Deletes an existing cloud config template'
delete_.params = {
  id: { type: 'string' },
}

export { delete_ as delete }
