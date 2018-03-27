// @flow

import mergeVhd_ from '../../vhd-merge'
import { type Remote, getHandler } from '../../remote-handlers'

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
