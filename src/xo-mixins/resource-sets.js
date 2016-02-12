import highland from 'highland'
import remove from 'lodash.remove'

import {
  NoSuchObject
} from '../api-errors'
import {
  generateUnsecureToken
} from '../utils'

// ===================================================================

class NoSuchResourceSet extends NoSuchObject {
  constructor (id) {
    super(id, 'resource set')
  }
}

// ===================================================================

export default class {
  constructor (xo) {
    this._store = null
    xo.on('starting', async () => {
      this._store = await xo.getStore('resourceSets')
    })
  }

  async _generateId () {
    let id
    do {
      id = generateUnsecureToken(8)
    } while (await this._store.has(id))
    return id
  }

  _save (set) {
    return this._store.put(set.id, set)
  }

  async createResourceSet (name, subjects = [], objects = []) {
    const id = await this._generateId()
    const set = {
      id,
      name,
      objects,
      subjects
    }

    await this._store.put(id, set)

    return set
  }

  deleteResourceSet (id) {
    return this._store.get(id).catch(error => {
      if (error.notFound) {
        throw new NoSuchResourceSet(id)
      }

      throw error
    })
  }

  async updateResourceSet (id, { name, subjects, objects }) {
    const set = await this.getResourceSet(id)
    if (name) {
      set.name = name
    }
    if (subjects) {
      set.subjects = subjects
    }
    if (objects) {
      set.objects = objects
    }

    await this._save(set)
  }

  getAllResourceSets () {
    return new Promise((resolve, reject) => {
      highland(this._store.createValueStream())
        .stopOnError(reject)
        .toArray(resolve)
    })
  }

  getResourceSet (id) {
    return this._store.get(id).catch(error => {
      if (error.notFound) {
        throw new NoSuchResourceSet(id)
      }

      throw error
    })
  }

  async addObjectToResourceSet (objectId, setId) {
    const set = await this.getResourceSet(setId)
    set.objects.push(objectId)
    await this._save(set)
  }

  async removeObjectFromResourceSet (objectId, setId) {
    const set = await this.getResourceSet(setId)
    remove(set.objects)
    await this._save(set)
  }

  async addSubjectToResourceSet (subjectId, setId) {
    const set = await this.getResourceSet(setId)
    set.subjects.push(subjectId)
    await this._save(set)
  }

  async removeSubjectToResourceSet (subjectId, setId) {
    const set = await this.getResourceSet(setId)
    remove(set.subjects, subjectId)
    await this._save(set)
  }
}
