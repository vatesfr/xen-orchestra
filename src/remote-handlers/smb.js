import Smb2 from '@marsaud/smb2-promise'

import RemoteHandlerAbstract from './abstract'
import {
  noop,
  pFinally
} from '../utils'

// Normalize the error code for file not found.
const normalizeError = error => {
  const { code } = error

  return (
    code === 'STATUS_OBJECT_NAME_NOT_FOUND' ||
    code === 'STATUS_OBJECT_PATH_NOT_FOUND'
  )
    ? Object.create(error, {
      code: {
        configurable: true,
        readable: true,
        value: 'ENOENT',
        writable: true
      }
    })
    : error
}

export default class SmbHandler extends RemoteHandlerAbstract {
  constructor (remote) {
    super(remote)
    this._forget = noop
  }

  get type () {
    return 'smb'
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

    let path = (this._remote.path !== '')
      ? this._remote.path
      : ''

    if (file) {
      path += file.replace(/\//g, '\\')
    }

    return path
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

  async _outputFile (file, data, options = {}) {
    const client = this._getClient(this._remote)
    const path = this._getFilePath(file)
    const dir = this._dirname(path)

    if (dir) {
      await client.ensureDir(dir)
    }

    return client.writeFile(path, data, options)::pFinally(() => { client.close() })
  }

  async _readFile (file, options = {}) {
    const client = this._getClient(this._remote)
    let content

    try {
      content = await client.readFile(this._getFilePath(file), options)::pFinally(() => { client.close() })
    } catch (error) {
      throw normalizeError(error)
    }

    return content
  }

  async _rename (oldPath, newPath) {
    const client = this._getClient(this._remote)

    try {
      await client.rename(this._getFilePath(oldPath), this._getFilePath(newPath))::pFinally(() => { client.close() })
    } catch (error) {
      throw normalizeError(error)
    }
  }

  async _list (dir = '.') {
    const client = this._getClient(this._remote)
    let list

    try {
      list = await client.readdir(this._getFilePath(dir))::pFinally(() => { client.close() })
    } catch (error) {
      throw normalizeError(error)
    }

    return list
  }

  async _createReadStream (file, options = {}) {
    const client = this._getClient(this._remote)
    let stream

    try {
      // FIXME ensure that options are properly handled by @marsaud/smb2
      stream = await client.createReadStream(this._getFilePath(file), options)
      stream.on('end', () => client.close())
    } catch (error) {
      throw normalizeError(error)
    }

    return stream
  }

  async _createOutputStream (file, options = {}) {
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
      await client.unlink(this._getFilePath(file))::pFinally(() => { client.close() })
    } catch (error) {
      throw normalizeError(error)
    }
  }

  async _getSize (file) {
    const client = await this._getClient(this._remote)
    let size

    try {
      size = await client.getSize(this._getFilePath(file))::pFinally(() => { client.close() })
    } catch (error) {
      throw normalizeError(error)
    }

    return size
  }
}
