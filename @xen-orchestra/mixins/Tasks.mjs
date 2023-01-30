import { createLogger } from '@xen-orchestra/log'
import { noSuchObject } from 'xo-common/api-errors.js'
import { Task } from '@vates/task'

export { Task }

const { debug } = createLogger('xo:mixins:Tasks')

export default class Tasks {
  // contains instance of running tasks (required to interact with running tasks)
  #tasks = new Map()

  async create({ name }) {
    const tasks = this.#tasks
    let id
    do {
      id = Math.random().toString(36).slice(2)
    } while (tasks.has(id))

    const task = new Task({
      name,
      onProgress: event => {
        debug('task event', event)
        if (event.type === 'end' && event.id === id) {
          tasks.delete(id)
        }
      },
    })
    task.id = id
    tasks.set(id, task)

    return task
  }

  async abort(id) {
    const task = this.#tasks.get(id)
    if (task === undefined) {
      throw noSuchObject(id, 'task')
    }
    return task.abort()
  }
}
