import { parse } from 'xo-remote-parser'

import RemoteHandlerAbstract from './abstract'

export default class S3Handler extends RemoteHandlerAbstract {
  constructor(remote, opts) {
    const { host, port, path } = parse(remote.url)
    super(remote, opts, {
      type: 'nfs',
      device: `${host}${port !== undefined ? ':' + port : ''}:${path}`,
    })
  }

  get type() {
    return 's3'
  }
}
