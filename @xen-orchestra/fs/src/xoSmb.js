import execa from 'execa'
import fs from 'fs-extra'
import { join } from 'path'
import { tmpdir } from 'os'

import LocalHandler from './local'

export default class XoSmb extends LocalHandler {
  constructor (
    remote,
    { mountsDir = join(tmpdir(), 'xo-fs-mounts'), ...opts } = {}
  ) {
    super(remote, opts)

    this._realPath = join(mountsDir, remote.id)
  }

  get type () {
    return 'smb'
  }

  _getRealPath () {
    return this._realPath
  }

  async _mount () {
    const { host, path, username, password, domain } = this._remote
    await fs.ensureDir(path || this._getRealPath())
    return execa(
      'mount',
      [
        '-t',
        'cifs',
        `\\\\${host}`,
        path || this._getRealPath(),
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

  async _sync () {
    // Check access (smb2 does not expose connect in public so far...)
    await this._mount()

    return this._remote
  }

  async _forget () {
    try {
      await this._umount(this._remote)
    } catch (_) {
      // We have to go on...
    }
  }

  async _umount () {
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
