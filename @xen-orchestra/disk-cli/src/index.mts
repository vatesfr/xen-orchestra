#!/usr/bin/env node

import { infoCommand } from './commands/info.mjs'
import { listCommand } from './commands/list.mjs'
import { transformCommand } from './commands/transform.mjs'

type CommandFn = (handlerUrl: string, path: string, extraArgs: string[]) => Promise<void>

const COMMANDS: Record<string, CommandFn> = {
  info: infoCommand,
  list: listCommand,
  transform: transformCommand,
}

function showHelp(exitCode: number): never {
  const commandDescriptions: Record<string, string> = {
    info: 'Show disk info (virtual size, uid, parent uid, block size)',
    list: 'List all disks at a path and display their properties in a table',
    transform: 'Convert a disk to another format and write to stdout (raw | vhd | qcow2)',
  }

  const commandList = Object.keys(COMMANDS)
    .map(name => `  ${name.padEnd(10)} ${commandDescriptions[name] ?? ''}`)
    .join('\n')

  process.stdout.write(`Usage: xo-disk-cli <command> <handler-url> <path> [options]

Commands:
${commandList}

Examples:
  xo-disk-cli info      file:///mnt/backups /xo-vm-backups/uuid/disk.alias.vhd
  xo-disk-cli list      file:///mnt/backups /xo-vm-backups/uuid/
  xo-disk-cli transform file:///mnt/backups /xo-vm-backups/uuid/disk.vhd raw > disk.img
  xo-disk-cli transform file:///mnt/backups /xo-vm-backups/uuid/disk.vhd qcow2 > disk.qcow2
`)
  process.exit(exitCode)
}

const [, , command, handlerUrl, diskPath, ...extraArgs] = process.argv

if (!command || command === '--help' || command === '-h') {
  showHelp(0)
}

if (!handlerUrl || !diskPath) {
  console.error('Error: handler-url and disk-path are required\n')
  showHelp(1)
}

const cmd = COMMANDS[command]
if (cmd === undefined) {
  console.error(`Unknown command: ${command}`)
  console.error(`Available commands: ${Object.keys(COMMANDS).join(', ')}\n`)
  showHelp(1)
}

try {
  await cmd(handlerUrl, diskPath, extraArgs)
} catch (error) {
  console.error(error)
  process.exit(1)
}
