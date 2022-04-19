#!/usr/bin/env node

'use strict'

const { delimiter } = require('path')
const { forEach, fromEvent } = require('promise-toolbox')
const { spawn } = require('child_process')

const { getPackages } = require('./utils')

const { env } = process

// run a script for each package (also run pre and post)
//
// TODO: https://docs.npmjs.com/misc/scripts#environment
require('exec-promise')(args => {
  const parallel = args[0] === '--parallel'
  const script = args[parallel ? 1 : 0]

  let errors = 0
  return getPackages(true)
    [parallel ? 'map' : 'forEach'](({ dir, name, package: { scripts } }) => {
      if (scripts == null) {
        return
      }

      const spawnOpts = {
        cwd: dir,
        env: Object.assign({}, env, {
          PATH: `${dir}/node_modules/.bin${delimiter}${env.PATH}`,
        }),
        shell: true,
        stdio: 'inherit',
      }
      return forEach.call([`pre${script}`, script, `post${script}`], script => {
        const command = scripts[script]
        if (command !== undefined) {
          console.log(`* ${name}:${script} −`, command)
          return fromEvent(spawn(command, spawnOpts), 'exit').then(code => {
            if (code !== 0) {
              ++errors
              console.log(`* ${name}:${script} − Error:`, code)
            }
          })
        }
      })
    })
    .then(() => {
      if (errors !== 0) {
        throw errors
      }
    })
})
