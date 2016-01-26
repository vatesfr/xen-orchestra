import RemoteHandlerAbstract from './abstract'
import Smb2 from '@marsaud/smb2-promise'
import startsWith from 'lodash.startswith'
import { noop } from '../utils'

export default class SmbHandler extends RemoteHandlerAbstract {
  constructor (remote) {
    super(remote)
    this._forget = noop
  }

  get type () {
    return 'smb'
  }

  _getInfo (remote) {
    if (!startsWith(remote.url, 'smb://')) {
      throw new Error('Incorrect remote type')
    }
    const url = remote.url.split('://')[1]
    const [auth, smb] = url.split('@')
    const [username, password] = auth.split(':')
    const [domain, sh] = smb.split('\\\\')
    const [host, path] = sh.split('\0')
    remote.host = host
    remote.path = path
    remote.domain = domain
    remote.username = username
    remote.password = password
    return remote
  }

  _getClient (remote) {
    return new Smb2({
      share: `\\\\${remote.host}`,
      domain: remote.domain,
      username: remote.username,
      password: remote.password,
      autoCloseTimeout: 0
    })
  }

  _getFilePath (file) {
    if (file === '.') {
      file = undefined
    }
    const parts = []
    if (this._remote.path !== '') {
      parts.push(this._remote.path)
    }
    if (file) {
      parts.push(file.split('/'))
    }
    return parts.join('\\')
  }

  _dirname (file) {
    const parts = file.split('\\')
    parts.pop()
    return parts.join('\\')
  }

  async _sync () {
    if (this._remote.enabled) {
      try {
        // Check access (smb2 does not expose connect in public so far...)
        await this.list()
      } catch (error) {
        this._remote.enabled = false
        this._remote.error = error.message
      }
    }
    return this._remote
  }

  async _outputFile (file, data, options) {
    const client = this._getClient(this._remote)
    const path = this._getFilePath(file)
    const dir = this._dirname(path)
    try {
      if (dir) {
        await client.ensureDir(dir)
      }
      return client.writeFile(path, data, options)
    } finally {
      client.close()
    }
  }

  async _readFile (file, options) {
    const client = this._getClient(this._remote)
    try {
      return client.readFile(this._getFilePath(file), options)
    } finally {
      client.close()
    }
  }

  async _rename (oldPath, newPath) {
    const client = this._getClient(this._remote)
    try {
      return client.rename(this._getFilePath(oldPath), this._getFilePath(newPath))
    } finally {
      client.close()
    }
  }

  async _list (dir = '.') {
    const client = this._getClient(this._remote)
    try {
      return client.readdir(this._getFilePath(dir))
    } finally {
      client.close()
    }
  }

  async _createReadStream (file, options) {
    const client = this._getClient(this._remote)
    const stream = await client.createReadStream(this._getFilePath(file), options) // FIXME ensure that options are properly handled by @marsaud/smb2
    stream.on('end', () => client.close())
    return stream
  }

  async _createOutputStream (file, options) {
    const client = this._getClient(this._remote)
    const path = this._getFilePath(file)
    const dir = this._dirname(path)
    let stream
    try {
      if (dir) {
        await client.ensureDir(dir)
      }
      stream = await client.createWriteStream(path, options) // FIXME ensure that options are properly handled by @marsaud/smb2
    } catch (err) {
      client.close()
      throw err
    }
    stream.on('finish', () => client.close())
    return stream
  }

  async _unlink (file) {
    const client = this._getClient(this._remote)
    try {
      return client.unlink(this._getFilePath(file))
    } finally {
      client.close()
    }
  }

  async _getSize (file) {
    const client = await this._getClient(this._remote)
    try {
      return client.getSize(this._getFilePath(file))
    } finally {
      client.close()
    }
  }
}
