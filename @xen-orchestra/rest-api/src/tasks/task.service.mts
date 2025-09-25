import type { XoTask } from '@vates/types/xo'
import type { RestApi } from '../rest-api/rest-api.mjs'
import * as CM from 'complex-matcher'

export class TaskService {
  #restApi: RestApi

  constructor(restApi: RestApi) {
    this.#restApi = restApi
  }

  async getTasks({ filter, limit = Infinity }: { filter?: string | ((obj: XoTask) => boolean); limit?: number } = {}) {
    const tasks: XoTask[] = []

    let userFilter: (obj: XoTask) => boolean = () => true
    if (filter !== undefined) {
      userFilter = typeof filter === 'string' ? CM.parse(filter).createPredicate() : filter
    }

    for await (const task of this.#restApi.tasks.list()) {
      if (limit === 0) {
        break
      }
      if (userFilter(task)) {
        tasks.push(task)
        limit--
      }
    }

    return tasks
  }
}
