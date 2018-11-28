import defer from 'golike-defer'
import Smb2 from '@marsaud/smb2'
import { finished } from 'readable-stream'

import RemoteHandlerAbstract from './abstract'

const noop = () => {}

// Normalize the error code for file not found.
class ErrorWrapper extends Error {
  constructor(error, newCode) {
    super(error.message)
    this.cause = error
    this.code = newCode
  }
}
const normalizeError = (error, shouldBeDirectory) => {
  const { code } = error

  return code === 'STATUS_OBJECT_NAME_NOT_FOUND' ||
    code === 'STATUS_OBJECT_PATH_NOT_FOUND'
    ? new ErrorWrapper(error, 'ENOENT')
    : code === 'STATUS_NOT_SUPPORTED' || code === 'STATUS_INVALID_PARAMETER'
    ? new ErrorWrapper(error, shouldBeDirectory ? 'ENOTDIR' : 'EISDIR')
    : error
}

export default class SmbHandler extends RemoteHandlerAbstract {
  constructor(remote, opts) {
    super(remote, opts)
    this._forget = noop
  }

  get type() {
    return 'smb'
  }

  _getClient() {
    const remote = this._remote

    return new Smb2({
      share: `\\\\${remote.host}`,
      domain: remote.domain,
      username: remote.username,
      password: remote.password,
      autoCloseTimeout: 0,
    })
  }

  _getFilePath(file) {
    if (file === '.') {
      file = undefined
    }

    let path = this._remote.path !== '' ? this._remote.path : ''

    // Ensure remote path is a directory.
    if (path !== '' && path[path.length - 1] !== '\\') {
      path += '\\'
    }

    if (file) {
      path += file.replace(/\//g, '\\')
    }

    return path
  }

  _dirname(file) {
    const parts = file.split('\\')
    parts.pop()
    return parts.join('\\')
  }

  async _sync() {
    // Check access (smb2 does not expose connect in public so far...)
    await this.list()

    return this._remote
  }

  async _outputFile(file, data, options = {}) {
    const path = this._getFilePath(file)
    const dir = this._dirname(path)

    const client = this._getClient()
    try {
      if (dir) {
        await client.ensureDir(dir)
      }

      return await client.writeFile(path, data, options)
    } finally {
      client.disconnect()
    }
  }

  @defer
  async _read($defer, file, buffer, position) {
    let client
    if (typeof file === 'string') {
      client = this._getClient()
      $defer.call(client, 'disconnect')
      file = await client.open(this._getFilePath(file))
      $defer.call(client, 'close', file)
    } else {
      ;({ client, file } = file.fd)
    }

    return client.read(file, buffer, 0, buffer.length, position)
  }

  async _readFile(file, options = {}) {
    const client = this._getClient()
    try {
      return await client.readFile(this._getFilePath(file), options)
    } catch (error) {
      throw normalizeError(error)
    } finally {
      client.disconnect()
    }
  }

  async _rename(oldPath, newPath) {
    const client = this._getClient()
    try {
      await client.rename(
        this._getFilePath(oldPath),
        this._getFilePath(newPath),
        {
          replace: true,
        }
      )
    } catch (error) {
      throw normalizeError(error)
    } finally {
      client.disconnect()
    }
  }

  async _list(dir = '.') {
    const client = this._getClient()
    try {
      return await client.readdir(this._getFilePath(dir))
    } catch (error) {
      throw normalizeError(error, true)
    } finally {
      client.disconnect()
    }
  }

  async _createReadStream(file, options = {}) {
    if (typeof file !== 'string') {
      file = file.path
    }

    const client = this._getClient()
    try {
      // FIXME ensure that options are properly handled by @marsaud/smb2
      const stream = await client.createReadStream(
        this._getFilePath(file),
        options
      )

      finished(stream, () => client.disconnect())

      return stream
    } catch (error) {
      client.disconnect()

      throw normalizeError(error)
    }
  }

  async _createOutputStream(file, options = {}) {
    if (typeof file !== 'string') {
      file = file.path
    }
    const path = this._getFilePath(file)

    const client = this._getClient()
    try {
      const dir = this._dirname(path)
      if (dir) {
        await client.ensureDir(dir)
      }

      // FIXME ensure that options are properly handled by @marsaud/smb2
      const stream = await client.createWriteStream(path, options)

      finished(stream, () => client.disconnect())

      return stream
    } catch (err) {
      client.disconnect()
      throw err
    }
  }

  async _unlink(file) {
    const client = this._getClient()
    try {
      await client.unlink(this._getFilePath(file))
    } catch (error) {
      throw normalizeError(error)
    } finally {
      client.disconnect()
    }
  }

  async _getSize(file) {
    const client = await this._getClient()
    try {
      return await client.getSize(
        this._getFilePath(typeof file === 'string' ? file : file.path)
      )
    } catch (error) {
      throw normalizeError(error)
    } finally {
      client.disconnect()
    }
  }

  // TODO: add flags
  async _openFile(path) {
    const client = this._getClient()
    return {
      client,
      file: await client.open(this._getFilePath(path)),
    }
  }

  async _closeFile({ client, file }) {
    try {
      await client.close(file)
    } finally {
      client.disconnect()
    }
  }
}
