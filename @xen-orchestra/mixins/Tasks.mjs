import { createLogger } from '@xen-orchestra/log'
import { noSuchObject } from 'xo-common/api-errors.js'
import { Task } from '@vates/task'

import { TreeMap } from './_TreeMap.mjs'

export { Task }

const { debug } = createLogger('xo:mixins:Tasks')

export default class Tasks {
  // contains instance of running tasks (required to interact with running tasks)
  #tasks = new Map()

  // contains tasks grouped by objects (tasks unrelated to objects are available under undefined)
  #tasksByObject = new TreeMap()

  create({ name, objectId }) {
    const tasks = this.#tasks
    let id
    do {
      id = Math.random().toString(36).slice(2)
    } while (tasks.has(id))

    const byObject = this.#tasksByObject

    const task = new Task({
      name,
      onProgress: event => {
        debug('task event', event)
        if (event.type === 'end' && event.id === id) {
          setTimeout(() => {
            tasks.delete(id)
            byObject.delete([objectId, id])
          }, 600e3)
        }
      },
    })
    task.id = id

    tasks.set(id, task)
    byObject.set([objectId, id], task)

    return task
  }

  getByObject(objectId) {
    return this.#tasksByObject.get(objectId)
  }

  async abort(id) {
    const task = this.#tasks.get(id)
    if (task === undefined) {
      throw noSuchObject(id, 'task')
    }
    return task.abort()
  }
}
