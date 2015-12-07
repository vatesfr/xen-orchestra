import startsWith from 'lodash.startswith'

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

  getRemoteHandler (remote) {
    if (!(remote.id in this._remoteHandlers)) {
      const handlers = {
        'local': RemoteHandlerLocal,
        'nfs': RemoteHandlerNfs,
        'smb': RemoteHandlerSmb
      }
      this._remoteHandlers[remote.id] = new handlers[remote.type](remote)
    }
    const handler = this._remoteHandlers[remote.id]
    handler.set(remote)
    return handler
  }

  _developRemote (remote) {
    const _remote = { ...remote }
    if (startsWith(_remote.url, 'file://')) {
      _remote.type = 'local'
      _remote.path = _remote.url.slice(6)
    } else if (startsWith(_remote.url, 'nfs://')) {
      _remote.type = 'nfs'
      const url = _remote.url.slice(6)
      const [host, share] = url.split(':')
      _remote.path = '/tmp/xo-server/mounts/' + _remote.id
      _remote.host = host
      _remote.share = share
    } else if (startsWith(_remote.url, 'smb://')) {
      _remote.type = 'smb'
      const url = _remote.url.slice(6)
      const [auth, smb] = url.split('@')
      const [username, password] = auth.split(':')
      const [domain, sh] = smb.split('\\\\')
      const [host, path] = sh.split('\0')
      _remote.host = host
      _remote.path = path
      _remote.domain = domain
      _remote.username = username
      _remote.password = password
    }
    return _remote
  }

  async getAllRemotes () {
    return mapToArray(await this._remotes.get(), this._developRemote)
  }

  async _getRemote (id) {
    const remote = await this._remotes.first(id)
    if (!remote) {
      throw new NoSuchRemote(id)
    }

    return remote
  }

  async getRemote (id) {
    return this._developRemote((await this._getRemote(id)).properties)
  }

  async createRemote ({name, url}) {
    let remote = await this._remotes.create(name, url)
    return await this.updateRemote(remote.get('id'), {enabled: true})
  }

  async updateRemote (id, {name, url, enabled, error}) {
    const remote = await this._getRemote(id)
    this._updateRemote(remote, {name, url, enabled, error})
    const r = this._developRemote(remote.properties)
    const props = await this.getRemoteHandler(r).sync()
    this._updateRemote(remote, props)
    return await this._developRemote(this._remotes.save(remote).properties)
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
    await this.getRemoteHandler(remote).forget()
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
      await this.getRemoteHandler(remote).forget()
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
