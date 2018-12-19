import execa from 'execa'
import fs from 'fs-extra'
import { tmpdir } from 'os'

import LocalHandler from './local'

export default class SmbHandler extends LocalHandler {
  constructor(remote, opts) {
    super(remote, opts)

    if (this._remote.path === '') {
      this._remote.path = tmpdir() + '/smb/'
    }

    const prefix = this._remote.path
    this._prefix = prefix !== '' ? prefix + '\\' : prefix
  }

  get type() {
    return 'smb'
  }

  async _forget() {
    try {
      await this._umount(this._remote)
    } catch (error) {
      throw error
    }
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
    await this._mount()

    return this._remote
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
