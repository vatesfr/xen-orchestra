// @flow

import { type Remote, getHandler } from '@xen-orchestra/fs'
import { mergeVhd as mergeVhd_ } from 'vhd-lib'

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
