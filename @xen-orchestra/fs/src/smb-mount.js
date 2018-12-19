import { parse } from 'xo-remote-parser'

import MountHandler from './_mount'
import normalizePath from './_normalizePath'

export default class SmbMountHandler extends MountHandler {
  constructor(remote, opts) {
    const { domain, host, password, path, share, username } = parse(remote)

    super(remote, opts, {
      type: 'cifs',
      device: '//' + host + normalizePath(share) + normalizePath(path),
      options: {
        domain: domain,
        password: password,
        user: username,
      },
    })
  }

  get type() {
    return 'smb'
  }
}
