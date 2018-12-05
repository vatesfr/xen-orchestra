import defer from 'golike-defer'
import Smb2 from '@marsaud/smb2'
import { finished } from 'readable-stream'

import RemoteHandlerAbstract from './abstract'

// Normalize the error code for file not found.
const wrapError = (error, code) => ({
  __proto__: error,
  cause: error,
  code,
})
const normalizeError = (error, shouldBeDirectory) => {
  const { code } = error

  return code === 'STATUS_DIRECTORY_NOT_EMPTY'
    ? wrapError(error, 'ENOTEMPTY')
    : code === 'STATUS_FILE_IS_A_DIRECTORY'
    ? wrapError(error, 'EISDIR')
    : code === 'STATUS_OBJECT_NAME_NOT_FOUND' ||
      code === 'STATUS_OBJECT_PATH_NOT_FOUND'
    ? wrapError(error, 'ENOENT')
    : code === 'STATUS_OBJECT_NAME_COLLISION'
    ? wrapError(error, 'EEXIST')
    : code === 'STATUS_NOT_SUPPORTED' || code === 'STATUS_INVALID_PARAMETER'
    ? wrapError(error, shouldBeDirectory ? 'ENOTDIR' : 'EISDIR')
    : error
}

export default class SmbHandler extends RemoteHandlerAbstract {
  constructor(remote, opts) {
    super(remote, opts)

    const prefix = this._remote.path
    this._prefix = prefix !== '' ? prefix + '\\' : prefix
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
    return this._prefix + file.slice(1).replace(/\//g, '\\')
  }

  _dirname(file) {
    const parts = file.split('\\')
    parts.pop()
    return parts.join('\\')
  }

  async _closeFile({ client, file }) {
    try {
      await client.close(file).catch(normalizeError)
    } finally {
      client.disconnect()
    }
  }

  async _createOutputStream(file, options) {
    const needsClose = typeof file === 'string'
    let client
    if (needsClose) {
      client = this._getClient()
    } else {
      ;({ client } = file.fd)
      file = file.path
    }
    const path = this._getFilePath(file)

    try {
      const dir = this._dirname(path)
      if (dir) {
        await client.ensureDir(dir)
      }

      // FIXME ensure that options are properly handled by @marsaud/smb2
      const stream = await client.createWriteStream(path, options)

      if (needsClose) {
        finished(stream, () => client.disconnect())
      }

      return stream
    } catch (err) {
      if (needsClose) {
        client.disconnect()
      }
      throw normalizeError(err)
    }
  }

  async _createReadStream(file, options) {
    const needsClose = typeof file === 'string'
    let client
    if (needsClose) {
      client = this._getClient()
    } else {
      ;({ client } = file.fd)
      file = file.path
    }

    try {
      // FIXME ensure that options are properly handled by @marsaud/smb2
      const stream = await client.createReadStream(
        this._getFilePath(file),
        options
      )

      if (needsClose) {
        finished(stream, () => client.disconnect())
      }

      return stream
    } catch (error) {
      if (needsClose) {
        client.disconnect()
      }
      throw normalizeError(error)
    }
  }

  async _getSize(file) {
    const needsClose = typeof file === 'string'
    let client
    if (needsClose) {
      client = this._getClient()
    } else {
      ;({ client } = file.fd)
      file = file.path
    }
    try {
      return await client.getSize(this._getFilePath(file))
    } catch (error) {
      throw normalizeError(error)
    } finally {
      if (needsClose) {
        client.disconnect()
      }
    }
  }

  async _list(dir) {
    const client = this._getClient()
    try {
      return await client.readdir(this._getFilePath(dir))
    } catch (error) {
      throw normalizeError(error, true)
    } finally {
      client.disconnect()
    }
  }

  // TODO: add flags
  async _openFile(path) {
    const client = this._getClient()
    return {
      client,
      file: await client.open(this._getFilePath(path)).catch(normalizeError),
    }
  }

  async _outputFile(file, data, options) {
    const path = this._getFilePath(file)
    const dir = this._dirname(path)

    const client = this._getClient()
    try {
      if (dir) {
        await client.ensureDir(dir)
      }

      return await client.writeFile(path, data, options)
    } catch (error) {
      throw normalizeError(error)
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

    return client
      .read(file, buffer, 0, buffer.length, position)
      .catch(normalizeError)
  }

  async _readFile(file, options) {
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

  async _rmdir(dir) {
    const client = this._getClient()
    try {
      await client.rmdir(this._getFilePath(dir))
    } catch (error) {
      throw normalizeError(error, true)
    } finally {
      client.disconnect()
    }
  }

  async _sync() {
    // Check access (smb2 does not expose connect in public so far...)
    await this.list('.')
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
}
