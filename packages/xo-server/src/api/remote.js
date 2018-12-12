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

export async function getInfo({ id }) {
  return this.getRemoteInfo(id)
}

getInfo.permission = 'admin'
getInfo.description = 'Gets info on disk used by remote point'
getInfo.params = {
  id: { type: 'string' },
}

export async function test({ id }) {
  return this.testRemote(id)
}

test.permission = 'admin'
test.description = 'Performs a read/write matching test on a remote point'
test.params = {
  id: { type: 'string' },
}

export async function list({ id }) {
  return this.listRemoteBackups(id)
}

list.permission = 'admin'
list.description = 'Lists the files found in a remote point'
list.params = {
  id: { type: 'string' },
}

export async function create({ name, url, options }) {
  return this.createRemote({ name, url, options })
}

create.permission = 'admin'
create.description = 'Creates a new fs remote point'
create.params = {
  name: { type: 'string' },
  url: { type: 'string' },
  options: { type: 'string', optional: true },
}

export async function set({ id, name, url, options, enabled }) {
  await this.updateRemote(id, { name, url, options, enabled })
}

set.permission = 'admin'
set.description = 'Modifies an existing fs remote point'
set.params = {
  id: { type: 'string' },
  name: { type: 'string', optional: true },
  url: { type: 'string', optional: true },
  options: { type: ['string', 'null'], optional: true },
  enabled: { type: 'boolean', optional: true },
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
