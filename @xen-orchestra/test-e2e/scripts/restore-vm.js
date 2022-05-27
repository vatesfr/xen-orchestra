#!/usr/bin/env node
'use strict'

/* eslint-disable no-console */

const Xo = require('xo-lib').default
const path = require('path')
const cypressJson = require(path.resolve(__dirname, '..', 'cypress.json'))

async function main() {
  const xo = new Xo({ url: cypressJson.env.xoLab.url })

  await xo.open()

  await xo.signIn({
    email: cypressJson.env.xoLab.username,
    password: cypressJson.env.xoLab.password,
  })

  console.log('Reverting Test VMs from snapshots')

  try {
    await Promise.all([
      xo.call('vm.revert', { snapshot: cypressJson.env.xenServerLts.snapshotId }),
      xo.call('vm.revert', { snapshot: cypressJson.env.xcpNgLts.snapshotId }),
      xo.call('vm.revert', { snapshot: cypressJson.env.xenOrchestra.snapshotId }),
    ])
  } catch (error) {
    console.error('Error happened while reverting VMs')
    throw error
  }

  xo.close()

  console.log('VMs reverted successfully.')
}

main()

/* eslint-enable no-console */
