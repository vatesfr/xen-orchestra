#!/usr/bin/env node

import { infoCommand } from './commands/info.mjs'
import { listCommand } from './commands/list.mjs'
import { scanStoreCommand } from './commands/scanStore.mjs'
import { transformCommand } from './commands/transform.mjs'

type CommandFn = (handlerUrl: string, path: string, extraArgs: string[]) => Promise<void>

const COMMANDS: Record<string, CommandFn> = {
  info: infoCommand,
  list: listCommand,
  'scan-store': scanStoreCommand,
  transform: transformCommand,
}

// commands working on the whole remote: no <path>
const REMOTE_COMMANDS = new Set(['scan-store'])

function showHelp(exitCode: number): never {
  const commandDescriptions: Record<string, string> = {
    info: 'Show disk info (virtual size, uid, parent uid, block size); --chain shows the full parent chain, --size adds the size on disk',
    list: 'List all disks at a path and display their properties in a table; --size adds the size on disk',
    'scan-store':
      'Maintenance of the hbd block store: reports the unused blocks, --remove deletes them, --verify rereads every block. Run with no backup job using the remote, after a backup cleanup',
    transform: 'Convert a disk to another format and write to stdout (raw | vhd | qcow2)',
  }

  const commandList = Object.keys(COMMANDS)
    .map(name => `  ${name.padEnd(10)} ${commandDescriptions[name] ?? ''}`)
    .join('\n')

  process.stdout.write(`Usage: xo-disk-cli <command> <handler-url> <path> [options]
       xo-disk-cli scan-store <handler-url> [--remove] [--verify] [--verbose]

Commands:
${commandList}

Examples:
  xo-disk-cli info      file:///mnt/backups /xo-vm-backups/uuid/disk.alias.vhd
  xo-disk-cli info      file:///mnt/backups /xo-vm-backups/uuid/disk.alias.vhd --chain --size
  xo-disk-cli list      file:///mnt/backups /xo-vm-backups/uuid/
  xo-disk-cli list      file:///mnt/backups /xo-vm-backups/uuid/ --size
  xo-disk-cli scan-store file:///mnt/backups
  xo-disk-cli scan-store file:///mnt/backups --remove --verify
  xo-disk-cli transform file:///mnt/backups /xo-vm-backups/uuid/disk.vhd raw > disk.img
  xo-disk-cli transform file:///mnt/backups /xo-vm-backups/uuid/disk.vhd qcow2 > disk.qcow2
`)
  process.exit(exitCode)
}

const [, , command, handlerUrl, ...args] = process.argv

if (!command || command === '--help' || command === '-h') {
  showHelp(0)
}

const needsPath = !REMOTE_COMMANDS.has(command)
const [diskPath, ...extraArgs] = needsPath ? args : ['', ...args]

if (!handlerUrl || (needsPath && !diskPath)) {
  console.error(needsPath ? 'Error: handler-url and disk-path are required\n' : 'Error: handler-url is required\n')
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
