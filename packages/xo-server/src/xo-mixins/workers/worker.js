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

export async function mergeVhd(
  parentRemote: Remote,
  parentPath: string,
  childRemote: Remote,
  childPath: string
) {
  const parentHandler = getHandler(parentRemote, config.remoteOptions)
  const childHandler = getHandler(childRemote, config.remoteOptions)

  // DO NOT forget the handlers as it they are still in use in the main process
  await parentHandler.sync()
  await childHandler.sync()

  return mergeVhd_(parentHandler, parentPath, childHandler, childPath)
}
