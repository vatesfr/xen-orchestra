import execa from 'execa'
import fs from 'fs-extra'

import LocalHandler from './local'

export default class MountHandler extends LocalHandler {
  constructor(remote, opts, params) {
    super(remote, opts)

    this._remote.params = params
  }

  async _forget() {
    try {
      await this._umount(this._remote)
    } catch (error) {
      throw error
    }
  }

  _getRealPath() {
    return this._realPath
  }

  async _mount() {
    await fs.ensureDir(this._getRealPath())
    const { params } = this._remote
    return execa(
      'mount',
      [
        '-t',
        params.type,
        params.host,
        this._getRealPath(),
        '-o',
        params.options,
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
    await execa('umount', ['--force', this._getRealPath()], {
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
