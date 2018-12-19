import execa from 'execa'

import LocalHandler from './local'

export default class MountHandler extends LocalHandler {
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
