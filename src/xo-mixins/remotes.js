import RemoteHandlerLocal from '../remote-handlers/local'
import RemoteHandlerNfs from '../remote-handlers/nfs'
import RemoteHandlerSmb from '../remote-handlers/smb'
import {
  forEach
} from '../utils'
import {
  NoSuchObject
} from '../api-errors'
import {
  Remotes
} from '../models/remote'

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
      await this.initRemotes()
      await this.syncAllRemotes()
    })
    xo.on('stop', () => this.forgetAllRemotes())
  }

  async getRemoteHandler (remote) {
    if (typeof remote === 'string') {
      remote = await this.getRemote(remote)
    }
    const Handler = {
      file: RemoteHandlerLocal,
      smb: RemoteHandlerSmb,
      nfs: RemoteHandlerNfs
    }

    // FIXME: should be done in xo-remote-parser.
    const type = remote.url.split('://')[0]
    if (!Handler[type]) {
      throw new Error('Unhandled remote type')
    }
    return new Handler[type](remote)
  }

  async getAllRemotes () {
    return this._remotes.get()
  }

  async _getRemote (id) {
    const remote = await this._remotes.first(id)
    if (!remote) {
      throw new NoSuchRemote(id)
    }

    return remote
  }

  async getRemote (id) {
    return (await this._getRemote(id)).properties
  }

  async createRemote ({name, url}) {
    let remote = await this._remotes.create(name, url)
    return /* await */ this.updateRemote(remote.get('id'), {enabled: true})
  }

  async updateRemote (id, {name, url, enabled, error}) {
    const remote = await this._getRemote(id)
    this._updateRemote(remote, {name, url, enabled, error})
    const handler = await this.getRemoteHandler(remote.properties)
    const props = await handler.sync()
    this._updateRemote(remote, props)
    return (await this._remotes.save(remote)).properties
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
    const handler = await this.getRemoteHandler(id)
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
    for (let remote of remotes) {
      try {
        (await this.getRemoteHandler(remote)).forget()
      } catch (_) {}
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
