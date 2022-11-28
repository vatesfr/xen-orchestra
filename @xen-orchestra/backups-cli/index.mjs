#!/usr/bin/env node
import { composeCommands } from './_composeCommands.mjs'

const importDefault = async path => (await import(path)).default

composeCommands({
  'clean-vms': {
    get default() {
      return importDefault('./commands/clean-vms.mjs')
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
    get default() {
      return importDefault('./commands/create-symlink-index.mjs')
    },
    usage: 'xo-vm-backups <field path>',
  },
  info: {
    get default() {
      return importDefault('./commands/info.mjs')
    },
    usage: 'xo-vm-backups/*',
  },
})(process.argv.slice(2), 'xo-backups').catch(error => {
  console.error('main', error)
  process.exitCode = 1
})
