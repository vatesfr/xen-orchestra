import { join } from 'path'
import { parse } from 'xo-remote-parser'
import { tmpdir } from 'os'

import MountHandler from './_mount'

const DEFAULT_NFS_OPTIONS = 'vers=3'

export default class NfsHandler extends MountHandler {
  constructor(
    remote,
    { mountsDir = join(tmpdir(), 'xo-fs-mounts'), ...opts } = {}
  ) {
    const { host, port, path, options } = parse(remote.url)
    super(remote, opts, {
      type: 'nfs',
      host: `${host}${port !== undefined ? ':' + port : ''}:${path}`,
      options:
        DEFAULT_NFS_OPTIONS + (options !== undefined ? `,${options}` : ''),
    })

    this._realPath = join(
      mountsDir,
      remote.id ||
        Math.random()
          .toString(36)
          .slice(2)
    )
  }

  get type() {
    return 'nfs'
  }
}
