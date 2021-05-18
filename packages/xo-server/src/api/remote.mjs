export async function getAll() {
  return this.getAllRemotes()
}

getAll.permission = 'admin'
getAll.description = 'Gets all existing fs remote points'

export async function get({ id }) {
  return this.getRemote(id)
}

get.permission = 'admin'
get.description = 'Gets an existing fs remote point'
get.params = {
  id: { type: 'string' },
}

export async function getAllInfo() {
  return this.getAllRemotesInfo()
}

getAllInfo.permission = 'admin'
getAllInfo.description = 'Gets all info of remote'

export async function test({ id }) {
  return this.testRemote(id)
}

test.permission = 'admin'
test.description = 'Performs a read/write matching test on a remote point'
test.params = {
  id: { type: 'string' },
}
export function create(props) {
  return this.createRemote(props)
}

create.permission = 'admin'
create.description = 'Creates a new fs remote point'
create.params = {
  name: { type: 'string' },
  options: { type: 'string', optional: true },
  proxy: { type: 'string', optional: true },
  url: { type: 'string' },
}

export async function set({ id, ...props }) {
  await this.updateRemote(id, props)
}

set.permission = 'admin'
set.description = 'Modifies an existing fs remote point'
set.params = {
  enabled: { type: 'boolean', optional: true },
  id: { type: 'string' },
  name: { type: 'string', optional: true },
  options: { type: ['string', 'null'], optional: true },
  proxy: { type: ['string', 'null'], optional: true },
  url: { type: 'string', optional: true },
}

async function delete_({ id }) {
  await this.removeRemote(id)
}

delete_.permission = 'admin'
delete_.description = 'Deletes an existing fs remote point'
delete_.params = {
  id: { type: 'string' },
}

export { delete_ as delete }
