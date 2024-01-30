#!/usr/bin/env node

import Disposable from 'promise-toolbox/Disposable'
import { getSyncedHandler } from '@xen-orchestra/fs'

import { mount } from './index.mjs'

async function* main([remoteUrl, vhdPathInRemote, mountPoint]) {
  if (mountPoint === undefined) {
    throw new TypeError('missing arg: cli <remoteUrl> <vhdPathInRemote> <mountPoint>')
  }
  const handler = yield getSyncedHandler({ url: remoteUrl })
  const mounted = await mount(handler, vhdPathInRemote, mountPoint)

  let disposePromise
  process.on('SIGINT', async () => {
    // ensure single dispose
    if (!disposePromise) {
      disposePromise = mounted.dispose()
    }
    await disposePromise
    process.exit()
  })
}

Disposable.wrap(main)(process.argv.slice(2))
