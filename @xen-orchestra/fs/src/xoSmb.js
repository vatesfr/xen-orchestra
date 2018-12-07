import execa from 'execa'
import fs from 'fs-extra'

import RemoteHandlerAbstract from './abstract'

export default class XoSmb extends RemoteHandlerAbstract {
  constructor(remote, opts) {
    super(remote, opts)

    const prefix = this._remote.path
    this._prefix = prefix !== '' ? prefix + '\\' : prefix
  }

  get type() {
    return 'smb'
  }

  _getFilePath(file) {
    return this._prefix + file.slice(1).replace(/\//g, '\\')
  }

  async _mount() {
    const { host, path, username, password, domain } = this._remote
    await fs.ensureDir(path)
    return execa(
      'mount',
      [
        '-t',
        'cifs',
        `\\\\${host}`,
        path,
        '-o',
        `user=${username},password=${password},domain=${domain}`,
      ],
      {
        env: {
          LANG: 'C',
        },
      }
    ).catch(error => {
      if (
        error == null ||
        typeof error.stderr !== 'string' ||
        !error.stderr.includes('already mounted')
      ) {
        throw error
      }
    })
  }

  async _sync() {
    // Check access (smb2 does not expose connect in public so far...)
    await this._mount()

    return this._remote
  }

  async _forget() {
    try {
      await this._umount(this._remote)
    } catch (_) {
      // We have to go on...
    }
  }

  async _umount() {
    await execa('umount', ['--force', this._remote.path], {
      env: {
        LANG: 'C',
      },
    }).catch(error => {
      if (
        error == null ||
        typeof error.stderr !== 'string' ||
        !error.stderr.includes('not mounted')
      ) {
        throw error
      }
    })
  }
}
