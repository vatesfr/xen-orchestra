#!/usr/bin/env node

import execPromise from 'exec-promise'

import commands from './commands'

function runCommand (commands, [command, ...args]) {
  if (command === undefined || command === '-h' || command === '--help') {
    command = 'help'
  }

  const fn = commands[command]

  if (fn === undefined) {
    if (command === 'help') {
      return `Usage:

${Object.keys(commands)
        .filter(command => command !== 'help')
        .map(command => `    ${this.command} ${command}`)
        .join('\n\n')}`
    }

    throw `invalid command ${command}` // eslint-disable-line no-throw-literal
  }

  return fn.call(
    {
      __proto__: this,
      command: `${this.command} ${command}`,
    },
    args
  )
}

execPromise(
  runCommand.bind(
    {
      command: 'vhd-cli',
      runCommand,
    },
    commands
  )
)
