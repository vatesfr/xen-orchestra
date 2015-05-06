import createDebug from 'debug'
import eventToPromise from 'event-to-promise'
import find from 'lodash.find'
import forEach from 'lodash.foreach'
import got from 'got'
import map from 'lodash.map'
import omit from 'lodash.omit'
import unzip from '@julien-f/unzip'
import {PassThrough} from 'stream'
import {promisify} from 'bluebird'
import {Xapi as XapiBase} from 'xen-api'

import {debounce} from './decorators'
import {JsonRpcError} from './api-errors'
import {parseXml, pFinally} from './utils'

const debug = createDebug('xo:xapi')

// ===================================================================

const gotPromise = promisify(got)

const wrapError = error => {
  const e = new Error(error[0])
  e.code = error[0]
  e.params = error.slice(1)
  return e
}

// ===================================================================

export default class Xapi extends XapiBase {
  constructor (...args) {
    super(...args)

    const objectsWatchers = this._objectWatchers = Object.create(null)
    const taskWatchers = this._taskWatchers = Object.create(null)

    // TODO: This is necessary to get UUIDs for host.patches.
    //
    // It will no longer be useful when using xen-api >= 0.5.
    this._refsToUuids = Object.create(null)

    const onAddOrUpdate = objects => {
      forEach(objects, object => {
        const {
          $id: id,
          $ref: ref,
          uuid
        } = object

        if (ref && uuid) {
          this._refsToUuids[ref] = uuid
        }

        // Watched object.
        if (id in objectsWatchers) {
          objectsWatchers[id].resolve(object)
          delete objectsWatchers[id]
        }
        if (ref in objectsWatchers) {
          objectsWatchers[ref].resolve(object)
          delete objectsWatchers[ref]
        }

        // Watched task.
        if (ref in taskWatchers) {
          const {status} = object

          if (status === 'success') {
            taskWatchers[ref].resolve(object.result)
          } else if (status === 'failure') {
            taskWatchers[ref].reject(wrapError(object.error_info))
          } else {
            return
          }

          delete taskWatchers[ref]
        }
      })
    }
    this.objects.on('add', onAddOrUpdate)
    this.objects.on('update', onAddOrUpdate)
  }

  // FIXME: remove this backported methods when xen-api >= 0.5
  getObject (idOrUuidOrRef, defaultValue) {
    const {_objects: {all: objects}} = this
    const object = (
      // if there is an UUID, it is also the $id.
      objects[idOrUuidOrRef] ||
      objects[this._refsToUuids[idOrUuidOrRef]]
    )

    if (object) return object

    if (arguments.length > 1) return defaultValue

    throw new Error('there is not object can be matched to ' + idOrUuidOrRef)
  }
  getObjectByRef (ref, defaultValue) {
    const {
      _refsToUuids: refsToUuids,

      // Objects ids are already UUIDs if they have one.
      _objects: {all: objectsByUuids}
    } = this

    if (ref in refsToUuids) {
      return objectsByUuids[refsToUuids[ref]]
    }

    if (arguments.length > 1) {
      return defaultValue
    }

    throw new Error('there is no object with the ref ' + ref)
  }
  getObjectByUuid (uuid, defaultValue) {
    const {
      // Objects ids are already UUIDs if they have one.
      _objects: {all: objectsByUuids}
    } = this

    if (uuid in objectsByUuids) {
      return objectsByUuids[uuid]
    }

    if (arguments.length > 1) {
      return defaultValue
    }

    throw new Error('there is no object with the UUID ' + uuid)
  }

  // =================================================================

  // Wait for an object to appear or to be updated.
  //
  // TODO: implements a timeout.
  _waitObject (idOrUuidOrRef) {
    let watcher = this._objectWatchers[idOrUuidOrRef]
    if (!watcher) {
      let resolve, reject
      const promise = new Promise((resolve_, reject_) => {
        resolve = resolve_
        reject = reject_
      })

      // Register the watcher.
      watcher = this._objectWatchers[idOrUuidOrRef] = {
        promise,
        resolve,
        reject
      }
    }

    return watcher.promise
  }

  // Returns the objects if already presents or waits for it.
  async _getOrWaitObject (idOrUuidOrRef) {
    return (
      this.getObject(idOrUuidOrRef, undefined) ||
      this._waitObject(idOrUuidOrRef)
    )
  }

  // =================================================================

  // Create a task.
  //
  // Returns the task object from the Xapi.
  async _createTask (name, description = '') {
    const ref = await this.call('task.create', name, description)

    pFinally(this._watchTask(ref), () => {
      this.call('task.destroy', ref)
    })

    return this._getOrWaitObject(ref)
  }

  // Waits for a task to be resolved.
  _watchTask (ref) {
    // If a task object is passed, unpacked the ref.
    if (typeof ref === 'object' && ref.$ref) ref = ref.$ref

    let watcher = this._taskWatchers[ref]
    if (!watcher) {
      let resolve, reject
      const promise = new Promise((resolve_, reject_) => {
        resolve = resolve_
        reject = reject_
      })

      // Register the watcher.
      watcher = this._taskWatchers[ref] = {
        promise,
        resolve,
        reject
      }
    }

    return watcher.promise
  }

  // =================================================================

  // FIXME: should be static
  @debounce(24 * 60 * 60 * 1000)
  async _getXenUpdates () {
    const [body, {statusCode}] = await gotPromise(
      'http://updates.xensource.com/XenServer/updates.xml'
    )

    if (statusCode !== 200) {
      throw new JsonRpcError('cannot fetch patches list from Citrix')
    }

    const {patchdata: data} = parseXml(body)

    const patches = Object.create(null)
    forEach(data.patches.patch, patch => {
      patches[patch.uuid] = {
        date: patch.timestamp,
        description: patch['name-description'],
        documentationUrl: patch.url,
        guidance: patch['after-apply-guidance'],
        name: patch['name-label'],
        url: patch['patch-url'],

        // TODO: what does it mean, should we handle it?
        // version: patch.version,
      }
    })

    const resolveVersionPatches = function (uuids) {
      const versionPatches = Object.create(null)

      forEach(uuids, ({uuid}) => {
        versionPatches[uuid] = patches[uuid]
      })

      return versionPatches
    }

    const versions = Object.create(null)
    let latestVersion
    forEach(data.serverversions.version, version => {
      versions[version.value] = {
        date: version.timestamp,
        name: version.name,
        id: version.value,
        documentationUrl: version.url,
        patches: resolveVersionPatches(version.patch)
      }

      if (version.latest) {
        latestVersion = versions[version.value]
      }
    })

    return {
      patches,
      latestVersion,
      versions
    }
  }

  // =================================================================

  async listMissingPoolPatchesOnHost (hostId) {
    const {
      software_version: {product_version: version},
      patches
    } = this.getObject(hostId)
    console.log
    return omit(
      (await this._getXenUpdates()).versions[version].patches,

      // TODO: simplify when we start to use xen-api >= 0.5
      map(patches, ref => {
        const hostPatch = this.objects.all[this._refsToUuids[ref]]
        return this._refsToUuids[hostPatch.pool_patch]
      })
    )
  }

  // -----------------------------------------------------------------

  async _uploadPoolPatch (stream, length) {
    const task = await this._createTask('Patch upload from XO')

    // TODO: Update when xen-api >= 0.5
    const poolMaster = this.objects.all[this._refsToUuids[this.pool.master]]

    await Promise.all([
      gotPromise('http://' + poolMaster.address + '/pool_patch_upload', {
        method: 'put',
        body: stream,
        query: {
          session_id: this.sessionId,
          task_id: task.$ref
        },
        headers: {
          'content-length': length
        }
      }),
      this._watchTask(task)
    ]).then(([, patchRef]) => this._waitObject(patchRef))
  }

  async _getOrUploadPoolPatch (uuid) {
    try {
      return this.getObjectByUuid(uuid)
    } catch (error) {}

    debug('downloading patch %s', uuid)

    const patchInfo = (await this._getXenUpdates()).patches[uuid]

    const PATCH_RE = /\.xsupdate$/
    const proxy = new PassThrough()
    got(patchInfo.url).on('error', error => {
      // TODO: better error handling
      console.error(error)
    }).pipe(unzip.Parse()).on('entry', entry => {
      if (PATCH_RE.test(entry.path)) {
        proxy.emit('length', entry.size)
        entry.pipe(proxy)
      } else {
        entry.autodrain()
      }
    }).on('error', error => {
      // TODO: better error handling
      console.error(error)
    })

    const length = await eventToPromise(proxy, 'length')
    return this._uploadPoolPatch(proxy, length)
  }

  async installPoolPatchOnHost (patchUuid, hostId) {
    const patch = await this._getOrUploadPoolPatch(patchUuid)
    const host = this.getObject(hostId)

    debug('installing patch %s', patchUuid)

    await this.call('pool_patch.apply', patch.$ref, host.$ref)
  }

  async installPoolPatchOnAllHosts (patchUuid) {
    const patch = await this._getOrUploadPoolPatch(patchUuid)

    await this.call('pool_patch.pool_apply', patch.$ref)
  }

  // =================================================================

}
