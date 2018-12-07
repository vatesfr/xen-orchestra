import Smb2 from '@marsaud/smb2'

import LocalHandler from './local'

// Normalize the error code for file not found.
const wrapError = (error, code) => ({
  __proto__: error,
  cause: error,
  code,
})
const normalizeError = (error, shouldBeDirectory) => {
  const { code } = error

  throw code === 'STATUS_DIRECTORY_NOT_EMPTY'
    ? wrapError(error, 'ENOTEMPTY')
    : code === 'STATUS_FILE_IS_A_DIRECTORY'
    ? wrapError(error, 'EISDIR')
    : code === 'STATUS_NOT_A_DIRECTORY'
    ? wrapError(error, 'ENOTDIR')
    : code === 'STATUS_OBJECT_NAME_NOT_FOUND' ||
      code === 'STATUS_OBJECT_PATH_NOT_FOUND'
    ? wrapError(error, 'ENOENT')
    : code === 'STATUS_OBJECT_NAME_COLLISION'
    ? wrapError(error, 'EEXIST')
    : code === 'STATUS_NOT_SUPPORTED' || code === 'STATUS_INVALID_PARAMETER'
    ? wrapError(error, shouldBeDirectory ? 'ENOTDIR' : 'EISDIR')
    : error
}
const normalizeDirError = error => normalizeError(error, true)

export default class SmbHandler extends RemoteHandlerAbstract {
  constructor(remote, opts) {
    super(remote, opts)

    // defined in _sync()
    this._client = undefined

    const prefix = this._remote.path
    this._prefix = prefix !== '' ? prefix + '\\' : prefix
  }

  get type() {
    return 'smb'
  }

  _getFilePath(file) {
    return (
      this._prefix +
      (typeof file === 'string' ? file : file.path)
        .slice(1)
        .replace(/\//g, '\\')
    )
  }

  _dirname(file) {
    const parts = file.split('\\')
    parts.pop()
    return parts.join('\\')
  }

  _closeFile(file) {
    return this._client.close(file).catch(normalizeError)
  }

  _createReadStream(file, options) {
    if (typeof file === 'string') {
      file = this._getFilePath(file)
    } else {
      options = { autoClose: false, ...options, fd: file.fd }
      file = ''
    }
    return this._client.createReadStream(file, options).catch(normalizeError)
  }

  _createWriteStream(file, options) {
    if (typeof file === 'string') {
      file = this._getFilePath(file)
    } else {
      options = { autoClose: false, ...options, fd: file.fd }
      file = ''
    }
    return this._client.createWriteStream(file, options).catch(normalizeError)
  }

  _forget() {
    const client = this._client
    this._client = undefined
    return client.disconnect()
  }

  _getSize(file) {
    return this._client.getSize(this._getFilePath(file)).catch(normalizeError)
  }

  _list(dir) {
    return this._client.readdir(this._getFilePath(dir)).catch(normalizeDirError)
  }

  _mkdir(dir) {
    return this._client.mkdir(this._getFilePath(dir)).catch(normalizeDirError)
  }

  // TODO: add flags
  _openFile(path, flags) {
    return this._client
      .open(this._getFilePath(path), flags)
      .catch(normalizeError)
  }

  async _read(file, buffer, position) {
    const client = this._client
    const needsClose = typeof file === 'string'
    file = needsClose ? await client.open(this._getFilePath(file)) : file.fd
    try {
      return await client.read(file, buffer, 0, buffer.length, position)
    } catch (error) {
      normalizeError(error)
    } finally {
      if (needsClose) {
        await client.close(file)
      }
    }
  }

  _readFile(file, options) {
    return this._client
      .readFile(this._getFilePath(file), options)
      .catch(normalizeError)
  }

  _rename(oldPath, newPath) {
    return this._client
      .rename(this._getFilePath(oldPath), this._getFilePath(newPath), {
        replace: true,
      })
      .catch(normalizeError)
  }

  _rmdir(dir) {
    return this._client.rmdir(this._getFilePath(dir)).catch(normalizeDirError)
  }

  _sync() {
    const remote = this._remote

    this._client = new Smb2({
      share: `\\\\${remote.host}`,
      domain: remote.domain,
      username: remote.username,
      password: remote.password,
      autoCloseTimeout: 0,
    })

    // Check access (smb2 does not expose connect in public so far...)
    return this.list('.')
  }

  _unlink(file) {
    return this._client.unlink(this._getFilePath(file)).catch(normalizeError)
  }

  _writeFile(file, data, options) {
    return this._client
      .writeFile(this._getFilePath(file), data, options)
      .catch(normalizeError)
  }
}
