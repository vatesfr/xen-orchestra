import every from 'lodash.every'
import remove from 'lodash.remove'
import some from 'lodash.some'

import {
  NoSuchObject,
  Unauthorized
} from '../api-errors'
import {
  generateUnsecureToken,
  lightSet,
  streamToArray
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
    xo.on('start', async () => {
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

  async checkResourceSetConstraints (id, userId, objectIds) {
    const set = await this.getResourceSet(id)

    const user = this.getUser(userId)
    if ((
      user.permission !== 'admin' &&

      // The set does not contains ANY subjects related to this user
      // (itself or its groups).
      !some(set.subjects, lightSet(user.groups).add(user.id).has)
    ) || (
      objectIds &&

      // The set does not contains ALL objects.
      !every(objectIds, lightSet(set.objects).has)
    )) {
      throw new Unauthorized()
    }
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

  async deleteResourceSet (id) {
    const store = this._store

    if (await store.has(id)) {
      return store.del(id)
    }

    throw new NoSuchResourceSet(id)
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

  // If userId is provided, only resource sets available to that user
  // will be returned.
  async getAllResourceSets (userId = undefined) {
    let predicate
    if (userId != null) {
      const user = await this.getUser(userId)
      if (user.permission !== 'admin') {
        const userHasSubject = lightSet(user.groups).add(user.id).has
        predicate = set => some(set.subjects, userHasSubject)
      }
    }

    return streamToArray(this._store.createValueStream(), predicate)
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
