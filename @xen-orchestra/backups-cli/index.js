#!/usr/bin/env node

require('./_composeCommands')({
  'clean-vms': {
    get main() {
      return require('./commands/clean-vms')
    },
    usage: '[--force] xo-vm-backups/*',
  },
})(process.argv.slice(2), 'xo-backups').catch(error => {
  console.error('main', error)
  process.exitCode = 1
})
