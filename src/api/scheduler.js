export async function enable ({id}) {
  const schedule = await this.getSchedule(id)
  schedule.enabled = true
  await this.updateSchedule(id, schedule)
}

enable.permission = 'admin'
enable.description = 'Enables a schedule to run it\'s job as scheduled'
enable.params = {
  id: {type: 'string'}
}

export async function disable ({id}) {
  const schedule = await this.getSchedule(id)
  schedule.enabled = false
  await this.updateSchedule(id, schedule)
}

disable.permission = 'admin'
disable.description = 'Disables a schedule'
disable.params = {
  id: {type: 'string'}
}

export function getScheduleTable () {
  return this.scheduleTable
}

disable.permission = 'admin'
disable.description = 'Get a map of existing schedules enabled/disabled state'
