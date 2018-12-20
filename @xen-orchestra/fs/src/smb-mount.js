import { parse } from 'xo-remote-parser'

import MountHandler from './_mount'

export default class SmbMountHandler extends MountHandler {
  constructor(remote, opts) {
    const { domain, host, password, username } = parse(remote.url)
    super(remote, opts, {
      type: 'cifs',
      device: `//${host}`,
      options: `user=${username},password=${password},domain=${domain}`,
    })
  }

  get type() {
    return 'smb'
  }
}
