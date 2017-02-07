#!/usr/bin/env node

import execPromise from 'exec-promise'
import { RemoteHandlerLocal } from '@nraynaud/xo-fs'
import { resolve } from 'path'

import Vhd from './vhd'

execPromise(async args => {
  const vhd = new Vhd(
    new RemoteHandlerLocal({ url: 'file:///' }),
    resolve(args[0])
  )

  await vhd.readHeaderAndFooter()

  console.log(vhd._header)
  console.log(vhd._footer)
})
