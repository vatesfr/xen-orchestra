import { parse } from 'xo-remote-parser'

import MountHandler from './_mount'

const DEFAULT_NFS_OPTIONS = 'vers=3'

export default class NfsHandler extends MountHandler {
  constructor(remote, opts) {
    const { host, port, path, options } = parse(remote.url)
    super(remote, opts, {
      type: 'nfs',
      device: `${host}${port !== undefined ? ':' + port : ''}:${path}`,
      options:
        DEFAULT_NFS_OPTIONS + (options !== undefined ? `,${options}` : ''),
    })
  }

  get type() {
    return 'nfs'
  }
}
