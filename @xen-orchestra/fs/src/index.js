// @flow
import execa from 'execa'

import type RemoteHandler from './abstract'
import RemoteHandlerLocal from './local'
import RemoteHandlerNfs from './nfs'
import RemoteHandlerSmb from './smb'
import RemoteHandlerSmbMount from './smb-mount'

export type { default as RemoteHandler } from './abstract'
export type Remote = { url: string }

const HANDLERS = {
  file: RemoteHandlerLocal,
  nfs: RemoteHandlerNfs,
}

try {
  execa.sync('mount.cifs', ['-V'])
  HANDLERS.smb = RemoteHandlerSmbMount
} catch (_) {
  HANDLERS.smb = RemoteHandlerSmb
}

export const getHandler = (remote: Remote, ...rest: any): RemoteHandler => {
  // FIXME: should be done in xo-remote-parser.
  const type = remote.url.split('://')[0]

  const Handler = HANDLERS[type]
  if (!Handler) {
    throw new Error('Unhandled remote type')
  }
  return new Handler(remote, ...rest)
}
