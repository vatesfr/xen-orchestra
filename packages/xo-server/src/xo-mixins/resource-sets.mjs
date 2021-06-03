import asyncMapSettled from '@xen-orchestra/async-map/legacy.js'
import difference from 'lodash/difference.js'
import every from 'lodash/every.js'
import forEach from 'lodash/forEach.js'
import isObject from 'lodash/isObject.js'
import keyBy from 'lodash/keyBy.js'
import mapToArray from 'lodash/map.js'
import remove from 'lodash/remove.js'
import some from 'lodash/some.js'
import { decorateWith } from '@vates/decorate-with'
import { defer as deferrable } from 'golike-defer'
import { noSuchObject, notEnoughResources, unauthorized } from 'xo-common/api-errors.js'
import { synchronized } from 'decorator-synchronized'

import { generateUnsecureToken, lightSet, map, streamToArray } from '../utils.mjs'

// ===================================================================

const synchronizedResourceSets = synchronized()

const VM_RESOURCES = {
  cpus: true,
  disk: true,
  disks: true,
  memory: true,
  vms: true,
}

const computeVmXapiResourcesUsage = vm => {
  const processed = {}
  let disks = 0
  let disk = 0

  forEach(vm.$VBDs, vbd => {
    let vdi, vdiId
    if (vbd.type === 'Disk' && !processed[(vdiId = vbd.VDI)] && (vdi = vbd.$VDI)) {
      processed[vdiId] = true
      ++disks
      disk += +vdi.virtual_size
    }
  })

  return {
    cpus: vm.VCPUs_at_startup,
    disk,
    disks,
    memory: vm.memory_dynamic_max,
    vms: 1,
  }
}

const normalize = set => ({
  id: set.id,
  ipPools: set.ipPools || [],
  limits: set.limits
    ? map(set.limits, limit =>
        isObject(limit)
          ? limit
          : {
              available: limit,
              total: limit,
            }
      )
    : {},
  name: set.name || '',
  objects: set.objects || [],
  subjects: set.subjects || [],
})

// ===================================================================

export default class {
  constructor(app) {
    this._app = app

    this._store = null
    app.hooks.on('start', async () => {
      app.addConfigManager(
        'resourceSets',
        () => this.getAllResourceSets(),
        resourceSets => Promise.all(resourceSets.map(resourceSet => this._save(resourceSet))),
        ['groups', 'users']
      )

      this._store = await app.getStore('resourceSets')
    })
  }

  async _generateId() {
    let id
    do {
      id = generateUnsecureToken(8)
    } while (await this._store.has(id))
    return id
  }

  _save(set) {
    return this._store.put(set.id, set)
  }

  async checkResourceSetConstraints(id, userId, objectIds) {
    const set = await this.getResourceSet(id)

    const user = await this._app.getUser(userId)
    if (
      (user.permission !== 'admin' &&
        // The set does not contains ANY subjects related to this user
        // (itself or its groups).
        !some(set.subjects, lightSet(user.groups).add(user.id).has)) ||
      (objectIds &&
        // The set does not contains ALL objects.
        !every(objectIds, lightSet(set.objects).has))
    ) {
      throw unauthorized()
    }
  }

  async computeVmResourcesUsage(vm) {
    return Object.assign(
      computeVmXapiResourcesUsage(this._app.getXapi(vm).getObject(vm._xapiId)),
      await this._app.computeVmIpPoolsUsage(vm)
    )
  }

  async computeVmSnapshotResourcesUsage(snapshot) {
    if (this._app.config.get('selfService.ignoreVmSnapshotResources')) {
      return {}
    }
    return this.computeVmResourcesUsage(snapshot)
  }

  computeResourcesUsage(vm) {
    return vm.type === 'VM-snapshot' ? this.computeVmSnapshotResourcesUsage(vm) : this.computeVmResourcesUsage(vm)
  }

  async createResourceSet(name, subjects = undefined, objects = undefined, limits = undefined) {
    const id = await this._generateId()
    const set = normalize({
      id,
      name,
      objects,
      subjects,
      limits,
    })

    await this._store.put(id, set)

    return set
  }

  async deleteResourceSet(id) {
    const store = this._store

    if (await store.has(id)) {
      await Promise.all(
        mapToArray(this._app.getObjects({ filter: { resourceSet: id } }), vm =>
          this.setVmResourceSet(vm.id, null, true)
        )
      )
      return store.del(id)
    }

    throw noSuchObject(id, 'resourceSet')
  }

  @decorateWith(deferrable)
  async updateResourceSet(
    $defer,
    id,
    { name = undefined, subjects = undefined, objects = undefined, limits = undefined, ipPools = undefined }
  ) {
    const set = await this.getResourceSet(id)
    if (name) {
      set.name = name
    }
    if (subjects) {
      await Promise.all(
        difference(set.subjects, subjects).map(async subjectId =>
          Promise.all(
            (
              await this._app.getAclsForSubject(subjectId)
            ).map(async acl => {
              try {
                const object = this._app.getObject(acl.object)
                if ((object.type === 'VM' || object.type === 'VM-snapshot') && object.resourceSet === id) {
                  await this._app.removeAcl(subjectId, acl.object, acl.action)
                  $defer.onFailure(() => this._app.addAcl(subjectId, acl.object, acl.action))
                }
              } catch (error) {
                if (!noSuchObject.is(error)) {
                  throw error
                }
              }
            })
          )
        )
      )
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
            total: quantity,
          }
        }

        const { available, total } = previous

        return {
          available: available - total + quantity,
          total: quantity,
        }
      })
    }
    if (ipPools) {
      set.ipPools = ipPools
    }

    await this._save(set)
  }

  // If userId is provided, only resource sets available to that user
  // will be returned.
  async getAllResourceSets(userId = undefined) {
    let filter
    if (userId != null) {
      const user = await this._app.getUser(userId)
      if (user.permission !== 'admin') {
        const userHasSubject = lightSet(user.groups).add(user.id).has
        filter = set => some(set.subjects, userHasSubject)
      }
    }

    return streamToArray(this._store.createValueStream(), {
      filter,
      mapper: normalize,
    })
  }

  getResourceSet(id) {
    return this._store.get(id).then(normalize, error => {
      if (error.notFound) {
        throw noSuchObject(id, 'resourceSet')
      }

      throw error
    })
  }

  async addObjectToResourceSet(objectId, setId) {
    const set = await this.getResourceSet(setId)
    set.objects.push(objectId)
    await this._save(set)
  }

  async removeObjectFromResourceSet(objectId, setId) {
    const set = await this.getResourceSet(setId)
    remove(set.objects, id => id === objectId)
    await this._save(set)
  }

  async addIpPoolToResourceSet(ipPoolId, setId) {
    const set = await this.getResourceSet(setId)
    set.ipPools.push(ipPoolId)
    await this._save(set)
  }

  async removeIpPoolFromResourceSet(ipPoolId, setId) {
    const set = await this.getResourceSet(setId)
    remove(set.ipPools, id => id === ipPoolId)
    await this._save(set)
  }

  async addSubjectToResourceSet(subjectId, setId) {
    const set = await this.getResourceSet(setId)
    set.subjects.push(subjectId)
    await this._save(set)
  }

  async removeSubjectFromResourceSet(subjectId, setId) {
    const set = await this.getResourceSet(setId)
    remove(set.subjects, id => id === subjectId)
    await this._save(set)
  }

  async addLimitToResourceSet(limitId, quantity, setId) {
    const set = await this.getResourceSet(setId)
    set.limits[limitId] = quantity
    await this._save(set)
  }

  async removeLimitFromResourceSet(limitId, setId) {
    const set = await this.getResourceSet(setId)
    delete set.limits[limitId]
    await this._save(set)
  }

  @synchronizedResourceSets
  async allocateLimitsInResourceSet(limits, setId, force = false) {
    const set = await this.getResourceSet(setId)
    forEach(limits, (quantity, id) => {
      const limit = set.limits[id]
      if (!limit) {
        return
      }

      if ((limit.available -= quantity) < 0 && !force) {
        throw notEnoughResources([
          {
            resourceSet: setId,
            resourceType: id,
            available: limit.available + quantity,
            requested: quantity,
          },
        ])
      }
    })
    await this._save(set)
  }

  @synchronizedResourceSets
  async releaseLimitsInResourceSet(limits, setId) {
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

  async recomputeResourceSetsLimits() {
    const sets = keyBy(await this.getAllResourceSets(), 'id')
    forEach(sets, ({ limits }) => {
      forEach(limits, (limit, id) => {
        if (VM_RESOURCES[id] || id.startsWith('ipPool:')) {
          // only reset VMs related limits
          limit.available = limit.total
        }
      })
    })

    await Promise.all(
      mapToArray(this._app.getAllXapis(), xapi =>
        Promise.all(
          mapToArray(xapi.objects.all, async object => {
            let id
            let set
            if (
              object.$type !== 'VM' ||
              object.other_config['xo:backup:job'] !== undefined ||
              // No set for this VM.
              !(id = xapi.xo.getData(object, 'resourceSet')) ||
              // Not our set.
              !(set = sets[id])
            ) {
              return
            }

            const { limits } = set
            forEach(await this.computeResourcesUsage(this._app.getObject(object.$id)), (usage, resource) => {
              const limit = limits[resource]
              if (limit) {
                limit.available -= usage
              }
            })
          })
        )
      )
    )

    await Promise.all(mapToArray(sets, set => this._save(set)))
  }

  @decorateWith(deferrable)
  async setVmResourceSet($defer, vmId, resourceSetId, force = false) {
    const xapi = this._app.getXapi(vmId)
    const previousResourceSetId = xapi.xo.getData(vmId, 'resourceSet')

    if (resourceSetId === previousResourceSetId || (previousResourceSetId === undefined && resourceSetId === null)) {
      return
    }

    const resourcesUsage = await this.computeResourcesUsage(this._app.getObject(vmId))

    if (resourceSetId != null) {
      await this.allocateLimitsInResourceSet(resourcesUsage, resourceSetId, force)
      $defer.onFailure(() => this.releaseLimitsInResourceSet(resourcesUsage, resourceSetId))
    }

    if (previousResourceSetId !== undefined && (await this._store.has(previousResourceSetId))) {
      await this.releaseLimitsInResourceSet(resourcesUsage, previousResourceSetId)
      $defer.onFailure(() => this.allocateLimitsInResourceSet(resourcesUsage, previousResourceSetId, true))
    }

    await xapi.xo.setData(vmId, 'resourceSet', resourceSetId === undefined ? null : resourceSetId)
    $defer.onFailure(() =>
      xapi.xo.setData(vmId, 'resourceSet', previousResourceSetId === undefined ? null : previousResourceSetId)
    )

    if (previousResourceSetId !== undefined) {
      await this._app.removeAclsForObject(vmId)
    }
    if (resourceSetId != null) {
      await this.shareVmResourceSet(vmId)
    }
  }

  async shareVmResourceSet(vmId) {
    const xapi = this._app.getXapi(vmId)
    const resourceSetId = xapi.xo.getData(vmId, 'resourceSet')
    if (resourceSetId === undefined) {
      throw new Error('the vm is not in a resource set')
    }

    const { subjects } = await this.getResourceSet(resourceSetId)
    await asyncMapSettled(subjects, subject => this._app.addAcl(subject, vmId, 'admin'))
  }
}
