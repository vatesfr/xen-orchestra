#!/usr/bin/env node

require('./_composeCommands')({
  'clean-vms': {
    get main() {
      return require('./commands/clean-vms')
    },
    usage: '[--force] [--merge] xo-vm-backups/*',
  },
  'create-symlink-index': {
    get main() {
      return require('./commands/create-symlink-index')
    },
    usage: 'xo-vm-backups <field path>',
  },
  info: {
    get main() {
      return require('./commands/info')
    },
    usage: 'xo-vm-backups/*',
  },
})(process.argv.slice(2), 'xo-backups').catch(error => {
  console.error('main', error)
  process.exitCode = 1
})
