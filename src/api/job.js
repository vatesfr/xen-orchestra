// FIXME so far, no acls for jobs

export async function getAll () {
  return /* await */ this.getAllJobs()
}

getAll.permission = 'admin'
getAll.description = 'Gets all available jobs'

export async function get (id) {
  return /* await */ this.getJob(id)
}

get.permission = 'admin'
get.description = 'Gets an existing job'
get.params = {
  id: {type: 'string'}
}

export async function create ({job}) {
  return (await this.createJob(this.session.get('user_id'), job)).id
}

create.permission = 'admin'
create.description = 'Creates a new job from description object'
create.params = {
  job: {
    type: 'object',
    properties: {
      name: {type: 'string', optional: true},
      type: {type: 'string'},
      key: {type: 'string'},
      method: {type: 'string'},
      paramsVector: {
        type: 'object',
        properties: {
          type: {type: 'string'},
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: {type: 'string'},
                values: {
                  type: 'array',
                  items: {type: 'object'}
                }
              }
            }
          }
        },
        optional: true
      }
    }
  }
}

export async function set ({job}) {
  await this.updateJob(job)
}

set.permission = 'admin'
set.description = 'Modifies an existing job from a description object'
set.params = {
  job: {
    type: 'object',
    properties: {
      id: {type: 'string'},
      name: {type: 'string', optional: true},
      type: {type: 'string'},
      key: {type: 'string'},
      method: {type: 'string'},
      paramsVector: {
        type: 'object',
        properties: {
          type: {type: 'string'},
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: {type: 'string'},
                values: {
                  type: 'array',
                  items: {type: 'object'}
                }
              }
            }
          }
        },
        optional: true
      }
    }
  }
}

async function delete_ ({id}) {
  await this.removeJob(id)
}

delete_.permission = 'admin'
delete_.description = 'Deletes an existing job'
delete_.params = {
  id: {type: 'string'}
}

export {delete_ as delete}

export async function runSequence ({idSequence}) {
  await this.runJobSequence(idSequence)
}

runSequence.permission = 'admin'
runSequence.description = 'Runs jobs sequentially, in the provided order'
runSequence.params = {
  idSequence: {type: 'array', items: {type: 'string'}}
}
