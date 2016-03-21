import every from 'lodash.every'
import remove from 'lodash.remove'
import some from 'lodash.some'

import {
  NoSuchObject,
  Unauthorized
} from '../api-errors'
import {
  forEach,
  generateUnsecureToken,
  isObject,
  lightSet,
  map,
  streamToArray
} from '../utils'

// ===================================================================

class NoSuchResourceSet extends NoSuchObject {
  constructor (id) {
    super(id, 'resource set')
  }
}

const normalize = set => ({
  id: set.id,
  limits: set.limits
    ? map(set.limits, limit => isObject(limit)
      ? limit
      : {
        available: limit,
        total: limit
      }
    )
    : {},
  name: set.name || '',
  objects: set.objects || [],
  subjects: set.subjects || []
})

// ===================================================================

export default class {
  constructor (xo) {
    this._xo = xo

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

    const user = await this._xo.getUser(userId)
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

  computeVmResourcesUsage (vm) {
    const processed = {}
    let disks = 0
    let disk = 0
    forEach(this._xo.getXapi(vm).getObject(vm._xapiId).$VBDs, (vbd) => {
      let vdi, vdiId
      if (
        vbd.type === 'Disk' &&
        !processed[vdiId = vbd.VDI] &&
        (vdi = vbd.$VDI)
      ) {
        processed[vdiId] = true
        ++disks
        disk += +vdi.virtual_size
      }
    })

    return {
      cpus: vm.CPUs.number,
      disk,
      disks,
      memory: vm.memory.size,
      vms: 1
    }
  }

  async createResourceSet (name, subjects = undefined, objects = undefined, limits = undefined) {
    const id = await this._generateId()
    const set = normalize({
      id,
      name,
      objects,
      subjects,
      limits
    })

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

  async updateResourceSet (id, {
    name = undefined,
    subjects = undefined,
    objects = undefined,
    limits = undefined
  }) {
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
    if (limits) {
      const previousLimits = set.limits
      set.limits = map(limits, (quantity, id) => {
        const previous = previousLimits[id]
        if (!previous) {
          return {
            available: quantity,
            total: quantity
          }
        }

        const { available, total } = previous

        return {
          available: available - total + quantity,
          total: quantity
        }
      })
    }

    await this._save(set)
  }

  // If userId is provided, only resource sets available to that user
  // will be returned.
  async getAllResourceSets (userId = undefined) {
    let filter
    if (userId != null) {
      const user = await this._xo.getUser(userId)
      if (user.permission !== 'admin') {
        const userHasSubject = lightSet(user.groups).add(user.id).has
        filter = set => some(set.subjects, userHasSubject)
      }
    }

    return streamToArray(this._store.createValueStream(), {
      filter,
      mapper: normalize
    })
  }

  getResourceSet (id) {
    return this._store.get(id).then(normalize, error => {
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

  async addLimitToResourceSet (limitId, quantity, setId) {
    const set = await this.getResourceSet(setId)
    set.limits[limitId] = quantity
    await this._save(set)
  }

  async removeLimitFromResourceSet (limitId, setId) {
    const set = await this.getResourceSet(setId)
    delete set.limits[limitId]
    await this._save(set)
  }

  async allocateLimitsInResourceSet (limits, setId) {
    const set = await this.getResourceSet(setId)
    forEach(limits, (quantity, id) => {
      const limit = set.limits[id]
      if (!limit) {
        return
      }

      if ((limit.available -= quantity) < 0) {
        throw new Error(`not enough ${id} available in the set ${setId}`)
      }
    })
    await this._save(set)
  }

  async releaseLimitsInResourceSet (limits, setId) {
    const set = await this.getResourceSet(setId)
    forEach(limits, (quantity, id) => {
      const limit = set.limits[id]
      if (!limit) {
        return
      }

      if ((limit.available += quantity) > limit.total) {
        limit.available = limit.total
      }
    })
    await this._save(set)
  }

  async recomputeResourceSetsLimits () {
    const sets = await this.getAllResourceSets()
    forEach(sets, ({ limits }) => {
      forEach(limits, (limit, id) => {
        limit.available = limit.total
      })
    })

    forEach(this._xo.getAllXapis(), xapi => {
      forEach(xapi.objects.all, object => {
        let id
        let set
        if (
          object.$type !== 'vm' ||

          // No set for this VM.
          !(id = xapi.xo.getData(object, 'resourceSet')) ||

          // Not our set.
          !(set = sets[id])
        ) {
          return
        }

        const { limits } = set
        forEach(this.computeVmResourcesUsage(object), (usage, resource) => {
          const limit = limits[resource]
          limit.available -= usage
        })
      })
    })

    await Promise.all(map(sets, (set) => this._save(set)))
  }
}
