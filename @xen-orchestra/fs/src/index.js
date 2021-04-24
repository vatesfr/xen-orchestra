import execa from 'execa'

import RemoteHandlerLocal from './local'
import RemoteHandlerNfs from './nfs'
import RemoteHandlerS3 from './s3'
import RemoteHandlerSmb from './smb'
import RemoteHandlerSmbMount from './smb-mount'

const HANDLERS = {
  file: RemoteHandlerLocal,
  nfs: RemoteHandlerNfs,
  s3: RemoteHandlerS3,
}

try {
  execa.sync('mount.cifs', ['-V'])
  HANDLERS.smb = RemoteHandlerSmbMount
} catch (_) {
  HANDLERS.smb = RemoteHandlerSmb
}

export const getHandler = (remote, ...rest) => {
  // FIXME: should be done in xo-remote-parser.
  const type = remote.url.split('://')[0]

  const Handler = HANDLERS[type]
  if (!Handler) {
    throw new Error('Unhandled remote type')
  }
  return new Handler(remote, ...rest)
}
