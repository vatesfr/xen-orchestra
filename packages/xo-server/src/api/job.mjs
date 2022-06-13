// FIXME so far, no acls for jobs

export function cancel({ runId }) {
  return this.cancelJobRun(runId)
}

cancel.permission = 'admin'
cancel.description = 'Cancel a current run'

export async function getAll() {
  return /* await */ this.getAllJobs('call')
}

getAll.permission = 'admin'
getAll.description = 'Gets all available jobs'

export async function get(id) {
  return /* await */ this.getJob(id, 'call')
}

get.permission = 'admin'
get.description = 'Gets an existing job'
get.params = {
  id: { type: 'string' },
}

export async function create({ job }) {
  if (!job.userId) {
    job.userId = this.apiContext.user.id
  }

  return (await this.createJob(job)).id
}

create.permission = 'admin'
create.description = 'Creates a new job from description object'
create.params = {
  job: {
    type: 'object',
    properties: {
      userId: { type: 'string', optional: true },
      name: { type: 'string', optional: true },
      timeout: { type: 'number', optional: true },
      type: { type: 'string' },
      key: { type: 'string' },
      method: { type: 'string' },
      paramsVector: {
        type: 'object',
        properties: {
          type: { type: 'string' },
          items: {
            type: 'array',
            items: {
              type: 'object',
            },
          },
        },
        optional: true,
      },
    },
  },
}

export async function set({ job }) {
  await this.updateJob(job)
}

set.permission = 'admin'
set.description = 'Modifies an existing job from a description object'
set.params = {
  job: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      name: { type: 'string', optional: true },
      timeout: { type: ['number', 'null'], optional: true },
      type: { type: 'string', optional: true },
      key: { type: 'string', optional: true },
      method: { type: 'string', optional: true },
      paramsVector: {
        type: 'object',
        properties: {
          type: { type: 'string' },
          items: {
            type: 'array',
            items: {
              type: 'object',
            },
          },
        },
        optional: true,
      },
    },
  },
}

async function delete_({ id }) {
  await this.removeJob(id)
}

delete_.permission = 'admin'
delete_.description = 'Deletes an existing job'
delete_.params = {
  id: { type: 'string' },
}

export { delete_ as delete }

export async function runSequence({ idSequence }) {
  await this.runJobSequence(idSequence)
}

runSequence.permission = 'admin'
runSequence.description = 'Runs jobs sequentially, in the provided order'
runSequence.params = {
  idSequence: { type: 'array', items: { type: 'string' } },
}
