#!/usr/bin/env node

require('./_composeCommands')({
  'clean-vms': {
    get main() {
      return require('./commands/clean-vms')
    },
    usage: `[--fix] [--merge] [--remove] xo-vm-backups/*

      Detects and repair issues with VM backups.

      Options:
        -f, --fix       Fix metadata issues (like size)
        -m, --merge     Merge (or continue merging) VHD files that are unused
        -r, --remove    Remove unused, incomplete, orphan, or corrupted files
`,
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
