#!/usr/bin/env node

'use strict'

const { fromEvent } = require('promise-toolbox')
const { spawn } = require('child_process')

const { getPackages } = require('./utils')

require('exec-promise')(([command, ...args]) =>
  getPackages().forEach(({ dir, name }) => {
    console.log('*', name)
    return fromEvent(
      spawn(command, args, {
        cwd: dir,
        stdio: 'inherit',
      }),
      'exit'
    ).then(code => {
      if (code !== 0) {
        throw code
      }
    })
  })
)
