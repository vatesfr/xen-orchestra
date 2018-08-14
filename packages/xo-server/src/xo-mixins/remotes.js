import synchronized from 'decorator-synchronized'
import { getHandler } from '@xen-orchestra/fs'
import { noSuchObject } from 'xo-common/api-errors'
import { ignoreErrors } from 'promise-toolbox'

import patch from '../patch'
import { mapToArray } from '../utils'
import { Remotes } from '../models/remote'

// ===================================================================

export default class {
  constructor (xo) {
    this._remotes = new Remotes({
      connection: xo._redis,
      prefix: 'xo:remote',
      indexes: ['enabled'],
    })
    this._handlers = { __proto__: null }

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

      const remotes = await this.getAllRemotes()
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

  async getRemoteHandler (remote, ignoreDisabled) {
    if (typeof remote === 'string') {
      remote = await this.getRemote(remote)
    }

    if (!(ignoreDisabled || remote.enabled)) {
      throw new Error('remote is disabled')
    }

    const { id } = remote
    const handlers = this._handlers
    let handler = handlers[id]
    if (handler === undefined) {
      handler = handlers[id] = getHandler(remote)
    }
    return handler
  }

  async testRemote (remote) {
    const handler = await this.getRemoteHandler(remote, true)
    return handler.test()
  }

  async getAllRemotes () {
    return this._remotes.get()
  }

  async getRemote (id) {
    const remote = await this._remotes.first(id)
    if (remote === undefined) {
      throw noSuchObject(id, 'remote')
    }
    return remote.properties
  }

  async createRemote ({ name, url }) {
    const remote = await this._remotes.add({
      name,
      url,
      enabled: false,
      error: '',
    })
    return /* await */ this.updateRemote(remote.get('id'), { enabled: true })
  }

  async updateRemote (id, { name, url, enabled }) {
    const remote = await this._updateRemote(id, { name, url, enabled })

    // force refreshing the handler
    delete this._handlers[id]
    const handler = await this.getRemoteHandler(remote, true)

    let error = ''
    try {
      await handler.sync()
    } catch (error_) {
      error = error_.message
    }
    return this._updateRemote(id, { error })
  }

  @synchronized()
  async _updateRemote (id, props) {
    const remote = await this.getRemote(id)
    patch(remote, props)
    return (await this._remotes.update(remote)).properties
  }

  async removeRemote (id) {
    const handler = await this.getRemoteHandler(id, true)
    await handler.forget()
    await this._remotes.remove(id)
  }
}
