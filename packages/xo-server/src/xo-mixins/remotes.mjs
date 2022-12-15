import asyncMapSettled from '@xen-orchestra/async-map/legacy.js'
import { basename } from 'path'
import { format, parse } from 'xo-remote-parser'
import {
  DEFAULT_ENCRYPTION_ALGORITHM,
  getHandler,
  isLegacyEncryptionAlgorithm,
  UNENCRYPTED_ALGORITHM,
} from '@xen-orchestra/fs'
import { ignoreErrors, timeout } from 'promise-toolbox'
import { invalidParameters, noSuchObject } from 'xo-common/api-errors.js'
import { synchronized } from 'decorator-synchronized'

import * as sensitiveValues from '../sensitive-values.mjs'
import patch from '../patch.mjs'
import { Remotes } from '../models/remote.mjs'

// ===================================================================

const obfuscateRemote = ({ url, ...remote }) => {
  const parsedUrl = parse(url)
  remote.url = format(sensitiveValues.obfuscate(parsedUrl))
  return remote
}

function validatePath(url) {
  const { path } = parse(url)
  if (path !== undefined && basename(path) === 'xo-vm-backups') {
    throw invalidParameters('remote url should not end with xo-vm-backups')
  }
}

export default class {
  constructor(app) {
    this._handlers = { __proto__: null }
    this._remotes = new Remotes({
      connection: app._redis,
      namespace: 'remote',
      indexes: ['enabled'],
    })
    this._remotesInfo = {}
    this._app = app

    app.hooks.on('clean', () => this._remotes.rebuildIndexes())
    app.hooks.on('start', async () => {
      app.addConfigManager(
        'remotes',
        () => this._remotes.get(),
        remotes => Promise.all(remotes.map(remote => this._remotes.update(remote)))
      )

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
        const algorithm = this._handlers[remote.id]._encryptor?.algorithm ?? UNENCRYPTED_ALGORITHM
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
    validatePath(url)

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
      validatePath(url)
    }

    const remote = await this._getRemote(id)

    // url is handled separately to take care of obfuscated values
    if (typeof url === 'string') {
      remote.url = format(sensitiveValues.merge(parse(url), parse(remote.url)))
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
}
