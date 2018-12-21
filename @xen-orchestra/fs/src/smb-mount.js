import { parse } from 'xo-remote-parser'

import MountHandler from './_mount'
import normalizePath from './_normalizePath'

export default class SmbMountHandler extends MountHandler {
  constructor(remote, opts) {
    const {
      domain = 'WORKGROUP',
      host,
      options,
      password,
      path,
      username,
    } = parse(remote.url)
    super(remote, opts, {
      type: 'cifs',
      device: '//' + host + normalizePath(path),
      options:
        `domain=${domain}` + (options !== undefined ? `,${options}` : ''),
      env: {
        USER: username,
        PASSWD: password,
      },
    })
  }

  get type() {
    return 'smb'
  }
}
