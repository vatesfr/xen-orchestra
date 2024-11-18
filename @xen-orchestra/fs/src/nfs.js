import { parse } from 'xo-remote-parser'

import MountHandler from './_mount'

export default class NfsHandler extends MountHandler {
  constructor(remote, opts) {
    const { host, port, path } = parse(remote.url)
    super(remote, opts, {
      type: 'nfs',
      device: `${host}:${path}`,
      options: port !== undefined ? `port=${port}` : undefined,
    })
  }

  get type() {
    return 'nfs'
  }
}
