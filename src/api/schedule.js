// FIXME so far, no acls for schedules

export async function getAll () {
  return /* await */ this.getAllSchedules()
}

getAll.permission = 'admin'
getAll.description = 'Gets all existing schedules'

export async function get (id) {
  return /* await */ this.getSchedule(id)
}

get.permission = 'admin'
get.description = 'Gets an existing schedule'
get.params = {
  id: {type: 'string'}
}

export async function create ({jobId, cron, enabled, name}) {
  return /* await */ this.createSchedule(this.session.get('user_id'), {job: jobId, cron, enabled, name})
}

create.permission = 'admin'
create.description = 'Creates a new schedule'
create.params = {
  jobId: {type: 'string'},
  cron: {type: 'string'},
  enabled: {type: 'boolean', optional: true},
  name: {type: 'string', optional: true}
}

export async function set ({id, jobId, cron, enabled, name}) {
  await this.updateSchedule(id, {job: jobId, cron, enabled, name})
}

set.permission = 'admin'
set.description = 'Modifies an existing schedule'
set.params = {
  id: {type: 'string'},
  jobId: {type: 'string', optional: true},
  cron: {type: 'string', optional: true},
  enabled: {type: 'boolean', optional: true},
  name: {type: 'string', optional: true}
}

async function delete_ ({id}) {
  await this.removeSchedule(id)
}

delete_.permission = 'admin'
delete_.description = 'Deletes an existing schedule'
delete_.params = {
  id: {type: 'string'}
}

export {delete_ as delete}
