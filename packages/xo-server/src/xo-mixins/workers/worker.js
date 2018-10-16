// @flow

import { type Remote, getHandler } from '@xen-orchestra/fs'
import { mergeVhd as mergeVhd_ } from 'vhd-lib'

// Use Bluebird for all promises as it provides better performance and
// less memory usage.
global.Promise = require('bluebird')

export function mergeVhd (
  parentRemote: Remote,
  parentPath: string,
  childRemote: Remote,
  childPath: string
) {
  return mergeVhd_(
    getHandler(parentRemote),
    parentPath,
    getHandler(childRemote),
    childPath
  )
}
