import execa from 'execa'
import fs from 'fs-extra'
import { join } from 'path'
import { tmpdir } from 'os'

import MountHandler from './mountHandler'

export default class SmbHandler extends MountHandler {
  constructor(
    remote,
    { mountsDir = join(tmpdir(), 'xo-smb-mounts'), ...opts } = {}
  ) {
    super(remote, opts)

    if (this._remote.path === '') {
      this._realPath = join(
        mountsDir,
        remote.id ||
          Math.random()
            .toString(36)
            .slice(2)
      )
    } else {
      this._realPath = this._remote.path
    }
  }

  get type() {
    return 'smb'
  }

  async _mount() {
    await fs.ensureDir(this._getRealPath())
    const { host, username, password, domain } = this._remote
    return execa(
      'mount',
      [
        '-t',
        'cifs',
        `\\\\${host}`,
        this._getRealPath(),
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
}
