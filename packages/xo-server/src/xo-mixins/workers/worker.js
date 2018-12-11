// @flow

import { type Remote, getHandler } from '@xen-orchestra/fs'
import { mergeVhd as mergeVhd_ } from 'vhd-lib'

// Use Bluebird for all promises as it provides better performance and
// less memory usage.
//
// $FlowFixMe
global.Promise = require('bluebird')

// $FlowFixMe
const config: Object = JSON.parse(process.env.XO_CONFIG)

export function mergeVhd(
  parentRemote: Remote,
  parentPath: string,
  childRemote: Remote,
  childPath: string
) {
  return mergeVhd_(
    getHandler(parentRemote, config.remoteOptions),
    parentPath,
    getHandler(childRemote, config.remoteOptions),
    childPath
  )
}
