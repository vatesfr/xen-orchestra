#!/usr/bin/env node
import type { UpgradablePackage } from '@vates/types'
import type { UpgradeResult } from './types.mjs'
import { parseArgs } from 'node:util'
import { AptPackageManager } from './apt.mjs'

const DEFAULT_STATE_DIR = '/var/lib/xo-server/data/xo-server-package-manager'

const USAGE = `Usage: package-manager <command> [options]

Commands:
  list                     List upgradable packages (from local cache)
  update                   Refresh the local package index
  upgrade [pkg...]         Upgrade packages (all if none specified)
  system-upgrade           Full distribution upgrade (dist-upgrade)
  status                   Show current operation status

Options:
  --state-dir <path>       State directory (default: ${DEFAULT_STATE_DIR})
  --json                   Output results as JSON
  --help                   Show this help message
`

function parseCliArgs() {
  try {
    return parseArgs({
      allowPositionals: true,
      options: {
        'state-dir': { type: 'string' },
        json: { type: 'boolean', default: false },
        help: { type: 'boolean', default: false },
      },
    })
  } catch (err) {
    process.stderr.write(`Error: ${(err as Error).message}\n\n${USAGE}`)
    process.exit(1)
  }
}

const { values, positionals } = parseCliArgs()

if (values.help === true || positionals.length === 0) {
  process.stdout.write(USAGE)
  process.exit(positionals.length === 0 ? 1 : 0)
}

const stateDir = values['state-dir'] ?? DEFAULT_STATE_DIR
const asJson = values.json === true
const [command, ...cmdArgs] = positionals

const apt = new AptPackageManager(stateDir)

function printJson(data: unknown): void {
  process.stdout.write(JSON.stringify(data, null, 2) + '\n')
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} kB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function printUpgradable(packages: UpgradablePackage[]): void {
  if (packages.length === 0) {
    process.stdout.write('All packages are up to date.\n')
    return
  }

  const nameW = Math.max(4, ...packages.map(p => p.name.length))
  const curW = Math.max(9, ...packages.map(p => p.installedVersion.length))
  const newW = Math.max(9, ...packages.map(p => p.version.length))
  const sizeW = 8

  const header = [
    'Name'.padEnd(nameW),
    'Installed'.padEnd(curW),
    'Available'.padEnd(newW),
    'Size'.padEnd(sizeW),
    'Description',
  ].join('  ')

  process.stdout.write(`${header}\n${'─'.repeat(header.length)}\n`)

  for (const pkg of packages) {
    process.stdout.write(
      [
        pkg.name.padEnd(nameW),
        pkg.installedVersion.padEnd(curW),
        pkg.version.padEnd(newW),
        formatSize(pkg.size).padEnd(sizeW),
        pkg.description,
      ].join('  ') + '\n'
    )
  }

  process.stdout.write(`\n${packages.length} package(s) can be upgraded.\n`)
}

function printUpgradeResult(result: UpgradeResult): void {
  if (result.packagesUpgraded.length === 0) {
    process.stdout.write('Nothing to upgrade.\n')
  } else {
    process.stdout.write(`Upgraded ${result.packagesUpgraded.length} package(s):\n`)
    for (const pkg of result.packagesUpgraded) {
      process.stdout.write(`  ${pkg}\n`)
    }
  }

  if (result.requiredAction !== 'none') {
    const messages: Record<string, string> = {
      restartServices: 'Restart services to apply updates.',
      restartXoServer: 'Restart XO Server to apply updates.',
      restartSystem: 'System reboot required.',
    }
    process.stdout.write(`\nNOTE: ${messages[result.requiredAction] ?? result.requiredAction}\n`)
  }

  process.stdout.write(`\nLog: ${result.logFile}\n`)
}

try {
  if (command === 'list') {
    apt.checkAvailable()
    const packages = await apt.listUpgradable()
    if (asJson) {
      printJson(packages)
    } else {
      printUpgradable(packages)
    }
  } else if (command === 'update') {
    apt.checkAvailable()
    await apt.updatePackageList()
    if (asJson) {
      printJson({ success: true })
    } else {
      process.stdout.write('Package list updated.\n')
    }
  } else if (command === 'upgrade') {
    apt.checkAvailable()
    const packages = cmdArgs.length > 0 ? cmdArgs : undefined
    const result = await apt.upgrade(packages)
    if (asJson) {
      printJson(result)
    } else {
      printUpgradeResult(result)
    }
  } else if (command === 'system-upgrade') {
    apt.checkAvailable()
    const result = await apt.systemUpgrade()
    if (asJson) {
      printJson(result)
    } else {
      printUpgradeResult(result)
    }
  } else if (command === 'status') {
    const status = apt.getOperationStatus()
    if (asJson) {
      printJson(status)
    } else if (status === null) {
      process.stdout.write('No operation in progress.\n')
    } else {
      const elapsedS = Math.round((Date.now() - status.startedAt) / 1000)
      process.stdout.write(`Operation:  ${status.operation}\n`)
      process.stdout.write(`PID:        ${status.pid}\n`)
      process.stdout.write(`Started:    ${new Date(status.startedAt).toLocaleString()} (${elapsedS}s ago)\n`)
      if (status.packages !== undefined) {
        process.stdout.write(`Packages:   ${status.packages.join(', ')}\n`)
      }
      if (status.progress !== undefined) {
        process.stdout.write(`Status:     ${status.progress.status}\n`)
        if (status.progress.currentPackage !== undefined) {
          process.stdout.write(`Package:    ${status.progress.currentPackage}\n`)
        }
        if (status.progress.percentage !== undefined) {
          process.stdout.write(`Progress:   ${status.progress.percentage.toFixed(1)}%\n`)
        }
      }
    }
  } else {
    process.stderr.write(`Unknown command: ${command}\n\n${USAGE}`)
    process.exit(1)
  }
} catch (err) {
  process.stderr.write(`Error: ${(err as Error).message}\n`)
  process.exit(1)
}
