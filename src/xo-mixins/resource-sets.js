import remove from 'lodash.remove'

import {
  NoSuchObject
} from '../api-errors'
import {
  createRawObject
} from '../utils'

// ===================================================================

class NoSuchResourceSet extends NoSuchObject {
  constructor (id) {
    super(id, 'resource set')
  }
}

// ===================================================================

export default class {
  constuctor (xo) {
    this._nextId = 0
    this._sets = createRawObject()
  }

  async createResourceSet (name) {
    const id = String(this._nextId++)
    const set = {
      id,
      name,
      objects: [],
      subjects: []
    }

    return (this._sets[id] = set)
  }

  async deleteResourceSet (id) {
    if (!this._sets[id]) {
      throw new NoSuchResourceSet(id)
    }

    delete this._sets[id]
  }

  async getAllResourceSets () {
    return this._sets
  }

  async getResourceSet (id) {
    const set = this._sets[id]
    if (!set) {
      throw new NoSuchResourceSet(id)
    }

    return set
  }

  async addObjectToResourceSet (objectId, setId) {
    const set = await this.getResourceSet(setId)
    set.objects.push(objectId)
  }

  async removeObjectFromResourceSet (objectId, setId) {
    const set = await this.getResourceSet(setId)
    remove(set.objects)
  }

  async addSubjectToResourceSet (subjectId, setId) {
    const set = this.getResourceSet(setId)
    set.subjects.push(subjectId)
  }

  async removeSubjectToResourceSet (subjectId, setId) {
    const set = this.getResourceSet(setId)
    remove(set.subjects, subjectId)
  }
}
