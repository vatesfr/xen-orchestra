// FIXME so far, no acls for schedules

export async function getAll() {
  return /* await */ this.getAllSchedules()
}

getAll.permission = 'admin'
getAll.description = 'Gets all existing schedules'

export async function get(id) {
  return /* await */ this.getSchedule(id)
}

get.permission = 'admin'
get.description = 'Gets an existing schedule'
get.params = {
  id: { type: 'string' },
}

export function create({ cron, enabled, jobId, name, timezone }) {
  return this.createSchedule({
    cron,
    enabled,
    jobId,
    name,
    timezone,
    userId: this.apiContext.user.id,
  })
}

create.permission = 'admin'
create.description = 'Creates a new schedule'
create.params = {
  cron: { type: 'string' },
  enabled: { type: 'boolean', optional: true },
  jobId: { type: 'string' },
  name: { type: 'string', minLength: 0, optional: true },
  timezone: { type: 'string', optional: true },
}

export async function set({ cron, enabled, id, jobId, name, timezone }) {
  await this.updateSchedule({ cron, enabled, id, jobId, name, timezone })
}

set.permission = 'admin'
set.description = 'Modifies an existing schedule'
set.params = {
  cron: { type: 'string', optional: true },
  enabled: { type: 'boolean', optional: true },
  id: { type: 'string' },
  jobId: { type: 'string', optional: true },
  name: { type: ['string', 'null'], minLength: 0, optional: true },
  timezone: { type: 'string', optional: true },
}

async function delete_({ id }) {
  await this.deleteSchedule(id)
}

delete_.permission = 'admin'
delete_.description = 'Deletes an existing schedule'
delete_.params = {
  id: { type: 'string' },
}

export { delete_ as delete }
