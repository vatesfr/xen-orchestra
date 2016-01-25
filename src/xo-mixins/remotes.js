import RemoteHandlerLocal from '../remote-handlers/local'
import RemoteHandlerNfs from '../remote-handlers/nfs'
import RemoteHandlerSmb from '../remote-handlers/smb'
import { Remotes } from '../models/remote'
import {
  NoSuchObject
} from '../api-errors'
import {
  forEach,
  mapToArray
} from '../utils'

// ===================================================================

class NoSuchRemote extends NoSuchObject {
  constructor (id) {
    super(id, 'remote')
  }
}

// ===================================================================

export default class {
  constructor (xo) {
    this._remotes = new Remotes({
      connection: xo._redis,
      prefix: 'xo:remote',
      indexes: ['enabled']
    })

    xo.on('start', async () => {
      // TODO: Should it be private?
      this._remoteHandlers = {}

      await this.initRemotes()
      await this.syncAllRemotes()
    })
    xo.on('stop', () => this.forgetAllRemotes())
  }

  _addHandler (remote) {
    const Handler = {
      file: RemoteHandlerLocal,
      smb: RemoteHandlerSmb,
      nfs: RemoteHandlerNfs
    }
    const type = remote.url.split('://')[0]
    if (!Handler[type]) {
      throw new Error('Unhandled remote type')
    }
    Object.defineProperty(remote, 'handler', {
      value: new Handler[type](remote)
    })
    remote.handler._getInfo(remote) // FIXME this has to be done by a specific code SHARED with the handler, not by the handler itself
    remote.type = remote.handler.type // FIXME subsequent workaround
    return remote
  }

  async getAllRemotes () {
    return mapToArray(await this._remotes.get(), this._addHandler)
  }

  async _getRemote (id) {
    const remote = await this._remotes.first(id)
    if (!remote) {
      throw new NoSuchRemote(id)
    }

    return remote
  }

  async getRemote (id) {
    return this._addHandler((await this._getRemote(id)).properties)
  }

  async createRemote ({name, url}) {
    let remote = await this._remotes.create(name, url)
    return await this.updateRemote(remote.get('id'), {enabled: true})
  }

  async updateRemote (id, {name, url, enabled, error}) {
    const remote = await this._getRemote(id)
    this._updateRemote(remote, {name, url, enabled, error})
    const r = this._addHandler(remote.properties)
    const props = await r.sync()
    this._updateRemote(remote, props)
    return await this._addHandler(this._remotes.save(remote).properties)
  }

  _updateRemote (remote, {name, url, enabled, error}) {
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
    const remote = await this.getRemote(id)
    await remote.handler.forget()
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
    for (let remote of remotes) {
      await remote.handler.forget()
    }
  }

  // TODO: Should it be private?
  async initRemotes () {
    const remotes = await this.getAllRemotes()
    if (!remotes || !remotes.length) {
      await this.createRemote({name: 'default', url: 'file://var/lib/xoa-backups'})
    }
  }
}
