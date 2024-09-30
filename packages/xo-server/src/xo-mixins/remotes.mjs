import asyncMapSettled from '@xen-orchestra/async-map/legacy.js'
import Obfuscate from '@vates/obfuscate'
import { basename } from 'path'
import { createLogger } from '@xen-orchestra/log'
import { format, parse } from 'xo-remote-parser'
import { DEFAULT_ENCRYPTION_ALGORITHM, getHandler, isLegacyEncryptionAlgorithm } from '@xen-orchestra/fs'
import { ignoreErrors, timeout } from 'promise-toolbox'
import { invalidParameters, noSuchObject } from 'xo-common/api-errors.js'
import { synchronized } from 'decorator-synchronized'

import patch from '../patch.mjs'
import { Remotes } from '../models/remote.mjs'
import Disposable from 'promise-toolbox/Disposable'

// ===================================================================

const { warn } = createLogger('xo:mixins:remotes')

const obfuscateRemote = ({ url, ...remote }) => {
  const parsedUrl = parse(url)
  remote.url = format(Obfuscate.obfuscate(parsedUrl))
  return remote
}

// these properties should be defined on the remote object itself and not as
// part of the remote URL
//
// there is a bug somewhere that keep putting them into the URL, this list
// is here to help track it
const INVALID_URL_PARAMS = ['benchmarks', 'id', 'info', 'name', 'proxy', 'enabled', 'error', 'url']

function validateUrl(url) {
  const parsedUrl = parse(url)

  const { path } = parsedUrl
  if (path !== undefined && basename(path) === 'xo-vm-backups') {
    throw invalidParameters('remote url should not end with xo-vm-backups')
  }

  for (const param of INVALID_URL_PARAMS) {
    if (Object.hasOwn(parsedUrl, param)) {
      // log with stack trace
      warn(new Error('invalid remote URL param ' + param))
    }
  }
}

export default class {
  constructor(app) {
    this._handlers = { __proto__: null }
    this._remotesInfo = {}
    this._app = app

    app.hooks.on('clean', () => this._remotes.rebuildIndexes())
    app.hooks.on('core started', () => {
      this._remotes = new Remotes({
        connection: app._redis,
        namespace: 'remote',
        indexes: ['enabled'],
      })

      app.addConfigManager(
        'remotes',
        () => this._remotes.get(),
        remotes => this._remotes.update(remotes)
      )
    })
    app.hooks.on('start', async () => {
      const remotes = await this._remotes.get()
      remotes.forEach(remote => {
        ignoreErrors.call(this.updateRemote(remote.id, {}))
      })
    })
    app.hooks.on('stop', async () => {
      const handlers = this._handlers
      for (const id in handlers) {
        try {
          delete handlers[id]
          await handlers[id].forget()
        } catch (_) {}
      }
    })
  }

  @synchronized
  async getRemoteHandler(remote) {
    if (typeof remote === 'string') {
      remote = await this._getRemote(remote)
    }

    if (remote.proxy !== undefined) {
      throw new Error('cannot get handler to proxy remote')
    }

    if (!remote.enabled) {
      throw new Error('remote is disabled')
    }

    const { id } = remote
    const handlers = this._handlers
    let handler = handlers[id]
    if (handler === undefined) {
      handler = getHandler(remote, this._app.config.get('remoteOptions'))

      try {
        await handler.sync()
        ignoreErrors.call(this._updateRemote(id, { error: null }))
      } catch (error) {
        ignoreErrors.call(this._updateRemote(id, { error }))
        throw error
      }

      handlers[id] = handler
    }

    return handler
  }

  async testRemote(remoteId) {
    const remote = await this.getRemoteWithCredentials(remoteId)

    const { readRate, writeRate, ...answer } =
      remote.proxy !== undefined
        ? await this._app.callProxyMethod(remote.proxy, 'remote.test', {
            remote,
          })
        : await this.getRemoteHandler(remoteId).then(handler => handler.test())

    if (answer.success) {
      const benchmark = {
        readRate,
        timestamp: Date.now(),
        writeRate,
      }
      await this._updateRemote(remoteId, {
        error: null,
        benchmarks:
          remote.benchmarks !== undefined
            ? [...remote.benchmarks.slice(-49), benchmark] // store 50 benchmarks
            : [benchmark],
      })
    } else {
      await this._updateRemote(remoteId, {
        error: answer.error,
      })
    }

    return answer
  }

  async getAllRemotesInfo() {
    const remotesInfo = this._remotesInfo
    await asyncMapSettled(this._remotes.get(), async remote => {
      if (!remote.enabled) {
        return
      }

      let encryption

      if (this._handlers[remote.id] !== undefined) {
        const algorithm = this._handlers[remote.id].encryptionAlgorithm
        encryption = {
          algorithm,
          isLegacy: isLegacyEncryptionAlgorithm(algorithm),
          recommendedAlgorithm: DEFAULT_ENCRYPTION_ALGORITHM,
        }
      }

      const promise =
        remote.proxy !== undefined
          ? this._app.callProxyMethod(remote.proxy, 'remote.getInfo', {
              remote,
            })
          : this.getRemoteHandler(remote.id).then(handler => handler.getInfo())

      try {
        await timeout.call(
          promise.then(info => {
            remotesInfo[remote.id] = {
              ...info,
              encryption,
            }
          }),
          5e3
        )
      } catch (_) {}
    })
    return remotesInfo
  }

  async getAllRemotes() {
    return (await this._remotes.get()).map(_ => obfuscateRemote(_))
  }

  async _getRemote(id) {
    const remote = await this._remotes.first(id)
    if (remote === undefined) {
      throw noSuchObject(id, 'remote')
    }

    const parsedUrl = parse(remote.url)
    let fixed = false
    for (const param of INVALID_URL_PARAMS) {
      if (Object.hasOwn(parsedUrl, param)) {
        // delete the value to trace its real origin when it's added back
        // with `updateRemote()`
        delete parsedUrl[param]
        fixed = true
      }
    }
    if (fixed) {
      remote.url = format(parsedUrl)
      this._remotes.update(remote).catch(warn)
    }

    return remote
  }

  async getRemoteWithCredentials(id) {
    const remote = await this._getRemote(id)
    if (!remote.enabled) {
      throw new Error('remote is disabled')
    }
    const parsedRemote = parse(remote.url)
    if (parsedRemote.type === 's3') {
      await this._app.checkFeatureAuthorization('BACKUP.S3')
    }
    return remote
  }

  getRemote(id) {
    return this._getRemote(id).then(obfuscateRemote)
  }

  async createRemote({ name, options, proxy, url }) {
    validateUrl(url)

    const params = {
      enabled: false,
      error: '',
      name,
      proxy,
      url,
    }
    if (options !== undefined) {
      params.options = options
    }
    const remote = await this._remotes.add(params)
    return /* await */ this.updateRemote(remote.id, { enabled: true })
  }

  updateRemote(id, { enabled, name, options, proxy, url }) {
    if (url !== undefined) {
      validateUrl(url)
    }

    const handlers = this._handlers
    const handler = handlers[id]
    if (handler !== undefined) {
      delete this._handlers[id]
      ignoreErrors.call(handler.forget())
    }

    return this._updateRemote(id, {
      enabled,
      name,
      options,
      proxy,
      url,
    })
  }

  @synchronized()
  async _updateRemote(id, { url, ...props }) {
    if (url !== undefined) {
      validateUrl(url)
    }

    const remote = await this._getRemote(id)

    // url is handled separately to take care of obfuscated values
    if (typeof url === 'string') {
      remote.url = format(Obfuscate.merge(parse(url), parse(remote.url)))
    }

    patch(remote, props)

    return await this._remotes.update(remote)
  }

  async removeRemote(id) {
    const handlers = this._handlers
    const handler = handlers[id]
    if (handler !== undefined) {
      delete handlers[id]
      ignoreErrors.call(handler.forget())
    }

    await this._remotes.remove(id)
  }

  async getTotalBackupSizeOnRemote(id) {
    const remote = await this._getRemote(id)

    if (remote.proxy !== undefined) {
      return this._app.callProxyMethod(remote.proxy, 'remote.getTotalBackupSize', {
        remote,
      })
    }

    return Disposable.use(this._app.getBackupsRemoteAdapter(remote), adapter => adapter.getTotalBackupSize())
  }
}
