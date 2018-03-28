// @flow

import { type Remote, getHandler } from '@xen-orchestra/fs'
import mergeVhd_ from '../../vhd-merge'

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
