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

    this._taskWatchers = Object.create(null)

    // TODO: This is necessary to get UUIDs for host.patches.
    //
    // It will no longer be useful when using xen-api >= 0.5.
    this._refsToUuids = Object.create(null)

    const onAddOrUpdate = objects => {
      forEach(objects, object => {
        const {
          $ref: ref,
          uuid
        } = object

        if (ref && uuid) {
          this._refsToUuids[ref] = uuid
        }

        // Watched task
        if (ref in this._taskWatchers) {
          const {status} = object

          if (status === 'success') {
            this._taskWatchers[ref].resolve(object.result)
          } else if (status === 'failure') {
            this._taskWatchers[ref].reject(wrapError(object.error_info))
          } else {
            return
          }

          delete this._taskWatchers[ref]
        }
      })
    }
    this.objects.on('add', onAddOrUpdate)
    this.objects.on('update', onAddOrUpdate)
  }

  // =================================================================

  async _createTask (name, description = '') {
    const ref = await this.call('task.create', name, description)

    pFinally(this._watchTask(ref), () => {
      this.call('task.destroy', ref)
    })

    return ref
  }

  _watchTask (ref) {
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
      latestVersion,
      versions
    }
  }

  // =================================================================

  async listMissingHostPatches (host) {
    return omit(
      (await this._getXenUpdates()).versions[host.version].patches,

      // TODO: simplify when we start to use xen-api >= 0.5
      map(host.patches, ref => {
        const hostPatch = this.objects.all[this._refsToUuids[ref]]
        return this._refsToUuids[hostPatch.pool_patch]
      })
    )
  }

  // =================================================================

  async _installHostPatch (host, stream, length) {
    const taskRef = await this._createTask('Patch upload from XO')

    await Promise.all([
      gotPromise('http://' + host.address + '/pool_patch_upload', {
        method: 'put',
        body: stream,
        query: {
          session_id: this.sessionId,
          task_id: taskRef
        },
        headers: {
          'content-length': length
        }
      }),
      this._watchTask(taskRef).then(
        (patchRef) => {
          debug('patch upload succeeded')

          return this.call('pool_patch.apply', patchRef, host.ref)
        },
        (error) => {
          debug('patch upload failed', error.stack || error)

          throw error
        }
      )
    ])
  }

  async installHostPatchFromUrl (host, patchUrl) {
    const PATCH_RE = /\.xsupdate$/
    const proxy = new PassThrough()
    got(patchUrl).on('error', error => {
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
    return this._installHostPatch(host, proxy, length)
  }
}
