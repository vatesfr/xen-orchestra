import { getHandler } from '@xen-orchestra/fs'
import { noSuchObject } from 'xo-common/api-errors'

import { forEach, mapToArray } from '../utils'
import { Remotes } from '../models/remote'

// ===================================================================

export default class {
  constructor (xo) {
    this._remotes = new Remotes({
      connection: xo._redis,
      prefix: 'xo:remote',
      indexes: ['enabled'],
    })

    xo.on('clean', () => this._remotes.rebuildIndexes())
    xo.on('start', async () => {
      xo.addConfigManager(
        'remotes',
        () => this._remotes.get(),
        remotes =>
          Promise.all(mapToArray(remotes, remote => this._remotes.save(remote)))
      )

      await this.syncAllRemotes()
    })
    xo.on('stop', () => this.forgetAllRemotes())
  }

  async getRemoteHandler (remote, ignoreDisabled) {
    if (typeof remote === 'string') {
      remote = await this.getRemote(remote)
    }

    if (!(ignoreDisabled || remote.enabled)) {
      throw new Error('remote is disabled')
    }

    return getHandler(remote)
  }

  async testRemote (remote) {
    const handler = await this.getRemoteHandler(remote, true)
    return handler.test()
  }

  async getAllRemotes () {
    return this._remotes.get()
  }

  async _getRemote (id) {
    const remote = await this._remotes.first(id)
    if (!remote) {
      throw noSuchObject(id, 'remote')
    }

    return remote
  }

  async getRemote (id) {
    return (await this._getRemote(id)).properties
  }

  async createRemote ({ name, url }) {
    const remote = await this._remotes.create(name, url)
    return /* await */ this.updateRemote(remote.get('id'), { enabled: true })
  }

  async updateRemote (id, { name, url, enabled, error }) {
    const remote = await this._getRemote(id)
    this._updateRemote(remote, { name, url, enabled, error })
    const handler = await this.getRemoteHandler(remote.properties, true)
    const props = await handler.sync()
    this._updateRemote(remote, props)
    return (await this._remotes.save(remote)).properties
  }

  _updateRemote (remote, { name, url, enabled, error }) {
    if (name) remote.set('name', name)
    if (url) remote.set('url', url)
    if (enabled !== undefined) remote.set('enabled', enabled)
    if (error) {
      remote.set('error', error)
    } else {
      remote.set('error', '')
    }
  }

  async removeRemote (id) {
    const handler = await this.getRemoteHandler(id, true)
    await handler.forget()
    await this._remotes.remove(id)
  }

  // TODO: Should it be private?
  async syncAllRemotes () {
    const remotes = await this.getAllRemotes()
    forEach(remotes, remote => {
      this.updateRemote(remote.id, {})
    })
  }

  // TODO: Should it be private?
  async forgetAllRemotes () {
    const remotes = await this.getAllRemotes()
    for (const remote of remotes) {
      try {
        ;(await this.getRemoteHandler(remote, true)).forget()
      } catch (_) {}
    }
  }
}
