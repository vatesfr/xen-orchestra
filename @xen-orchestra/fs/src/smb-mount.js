import { join } from 'path'
import { parse } from 'xo-remote-parser'
import { tmpdir } from 'os'

import MountHandler from './_mount'

export default class SmbMountHandler extends MountHandler {
  constructor(
    remote,
    { mountsDir = join(tmpdir(), 'xo-smb-mounts'), ...opts } = {}
  ) {
    const { domain, host, password, username } = parse(remote.url)
    super(remote, opts, {
      type: 'cifs',
      host: `\\\\${host}`,
      options: `user=${username},password=${password},domain=${domain}`,
    })

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
}
