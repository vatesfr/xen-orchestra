// @flow

import { type Remote, getHandler } from '@xen-orchestra/fs'
import { vhdMerge as mergeVhd_ } from '@xen-orchestra/vhd-lib'

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
