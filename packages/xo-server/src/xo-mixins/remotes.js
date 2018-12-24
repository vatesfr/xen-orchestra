import asyncMap from '@xen-orchestra/async-map'
import synchronized from 'decorator-synchronized'
import { format, parse } from 'xo-remote-parser'
import { getHandler } from '@xen-orchestra/fs'
import { ignoreErrors, timeout } from 'promise-toolbox'
import { noSuchObject } from 'xo-common/api-errors'

import * as sensitiveValues from '../sensitive-values'
import patch from '../patch'
import { mapToArray } from '../utils'
import { Remotes } from '../models/remote'

// ===================================================================

const obfuscateRemote = ({ url, ...remote }) => {
  remote.url = format(sensitiveValues.obfuscate(parse(url)))
  return remote
}

export default class {
  constructor(xo, { remoteOptions }) {
    this._handlers = { __proto__: null }
    this._remoteOptions = remoteOptions
    this._remotes = new Remotes({
      connection: xo._redis,
      prefix: 'xo:remote',
      indexes: ['enabled'],
    })
    this._remotesInfo = {}

    xo.on('clean', () => this._remotes.rebuildIndexes())
    xo.on('start', async () => {
      xo.addConfigManager(
        'remotes',
        () => this._remotes.get(),
        remotes =>
          Promise.all(
            mapToArray(remotes, remote => this._remotes.update(remote))
          )
      )

      const remotes = await this._remotes.get()
      remotes.forEach(remote => {
        ignoreErrors.call(this.updateRemote(remote.id, {}))
      })
    })
    xo.on('stop', async () => {
      const handlers = this._handlers
      for (const id in handlers) {
        try {
          await handlers[id].forget()
        } catch (_) {}
      }
    })
  }

  async getRemoteHandler(remote) {
    if (typeof remote === 'string') {
      remote = await this._getRemote(remote)
    }

    if (!remote.enabled) {
      throw new Error('remote is disabled')
    }

    const { id } = remote
    const handlers = this._handlers
    let handler = handlers[id]
    if (handler === undefined) {
      handler = handlers[id] = getHandler(remote, this._remoteOptions)
    }

    try {
      await handler.sync()
      ignoreErrors.call(this._updateRemote(id, { error: '' }))
    } catch (error) {
      ignoreErrors.call(this._updateRemote(id, { error: error.message }))
      throw error
    }

    return handler
  }

  async testRemote(remote) {
    const handler = await this.getRemoteHandler(remote)
    return handler.test()
  }

  async getAllRemotesInfo() {
    const remotes = await this._remotes.get()

    await asyncMap(remotes, async remote => {
      try {
        const handler = await this.getRemoteHandler(remote.id)
        this._remotesInfo[remote.id] = await timeout.call(
          handler.getInfo(),
          this._remoteOptions.timeoutInfo
        )
      } catch (_) {}
    })
    return this._remotesInfo
  }

  async getAllRemotes() {
    return (await this._remotes.get()).map(_ => obfuscateRemote(_))
  }

  async _getRemote(id) {
    const remote = await this._remotes.first(id)
    if (remote === undefined) {
      throw noSuchObject(id, 'remote')
    }
    return remote.properties
  }

  getRemote(id) {
    return this._getRemote(id).then(obfuscateRemote)
  }

  async createRemote({ name, url, options }) {
    const params = {
      name,
      url,
      enabled: false,
      error: '',
    }
    if (options !== undefined) {
      params.options = options
    }
    const remote = await this._remotes.add(params)
    return /* await */ this.updateRemote(remote.get('id'), { enabled: true })
  }

  updateRemote(id, { name, url, options, enabled }) {
    const handlers = this._handlers
    const handler = handlers[id]
    if (handler !== undefined) {
      delete this._handlers[id]
      ignoreErrors.call(handler.forget())
    }

    return this._updateRemote(id, {
      name,
      url,
      options,
      enabled,
    })
  }

  @synchronized()
  async _updateRemote(id, { url, ...props }) {
    const remote = await this._getRemote(id)

    // url is handled separately to take care of obfuscated values
    if (typeof url === 'string') {
      remote.url = format(sensitiveValues.merge(parse(url), parse(remote.url)))
    }

    patch(remote, props)

    return (await this._remotes.update(remote)).properties
  }

  async removeRemote(id) {
    const handler = this._handlers[id]
    if (handler !== undefined) {
      ignoreErrors.call(handler.forget())
    }

    await this._remotes.remove(id)
  }
}
