import type { UpgradablePackage } from '@vates/types'
import { execFile, spawn } from 'node:child_process'
import { access } from 'node:fs/promises'
import { promisify } from 'node:util'
import { parseDescriptions, parseStatusFdLine, parseUpgradableList } from './parse.mjs'

const execFileAsync = promisify(execFile)

const APT_GET_PATH = '/usr/bin/apt-get'
const APT_PATH = '/usr/bin/apt'
const APT_CACHE_PATH = '/usr/bin/apt-cache'
const REBOOT_REQUIRED_PATH = '/var/run/reboot-required'

// `apt-get update` fetches the indexes from the mirrors
const UPDATE_TIMEOUT = 5 * 60e3

// Debian policy: lowercase alphanumerics, `+`, `-` and `.`, starting with an alphanumeric
const PACKAGE_NAME_RE = /^[a-z0-9][a-z0-9+.-]+$/

const APT_ENV = { ...process.env, DEBIAN_FRONTEND: 'noninteractive', LC_ALL: 'C' }

async function exec(cmd: string, args: string[], { timeout = 0 } = {}): Promise<string> {
  try {
    const { stdout } = await execFileAsync(cmd, args, { env: APT_ENV, maxBuffer: 10 * 1024 * 1024, timeout })
    return stdout
  } catch (err) {
    const error = new Error(`${cmd} ${args.join(' ')} failed`)
    error.cause = err
    throw error
  }
}

export async function checkAptAvailable(): Promise<void> {
  try {
    await access(APT_GET_PATH)
  } catch (err) {
    const error = new Error(`${APT_GET_PATH} not found, this plugin requires a Debian-based system`)
    error.cause = err
    throw error
  }
}

export function isValidPackageName(name: string): boolean {
  return PACKAGE_NAME_RE.test(name)
}

export async function isRebootRequired(): Promise<boolean> {
  try {
    await access(REBOOT_REQUIRED_PATH)
    return true
  } catch {
    // dpkg creates this file when an upgraded package needs a reboot
    return false
  }
}

/**
 * Refresh the package indexes (`apt-get update`)
 */
export async function refreshPackageIndexes(): Promise<void> {
  await exec(APT_GET_PATH, ['update', '-q'], { timeout: UPDATE_TIMEOUT })
}

/**
 * List upgradable packages from the local indexes, see `refreshPackageIndexes()`
 */
export async function listUpgradablePackages(): Promise<UpgradablePackage[]> {
  const upgradablePackages = parseUpgradableList(await exec(APT_PATH, ['list', '--upgradable']))
  if (upgradablePackages.length === 0) {
    return []
  }

  const descriptions = parseDescriptions(await exec(APT_CACHE_PATH, ['show', ...upgradablePackages.map(p => p.name)]))
  return upgradablePackages.map(pkg => ({ ...pkg, description: descriptions.get(pkg.name) ?? '' }))
}

/**
 * Upgrade one package, or all upgradable packages if `packageName` is undefined
 *
 * `apt-get upgrade` never installs new dependencies: a package which needs one stays upgradable until it is upgraded
 * on its own.
 */
export async function upgradePackages({
  packageName,
  onProgress,
}: {
  readonly packageName?: string
  readonly onProgress: (percentage: number) => void
}): Promise<void> {
  const args = [
    '-y',
    '-q',
    // keep the local version of modified config files instead of prompting
    '-o',
    'Dpkg::Options::=--force-confdef',
    '-o',
    'Dpkg::Options::=--force-confold',
    '-o',
    'APT::Status-Fd=3',
  ]
  if (packageName === undefined) {
    args.push('upgrade')
  } else {
    if (!isValidPackageName(packageName)) {
      throw new Error(`invalid package name: ${packageName}`)
    }
    args.push('install', '--only-upgrade', packageName)
  }

  // the full output is already logged by apt in /var/log/apt/term.log
  const child = spawn(APT_GET_PATH, args, { env: APT_ENV, stdio: ['ignore', 'ignore', 'pipe', 'pipe'] })

  let stderr = ''
  child.stderr!.setEncoding('utf8').on('data', (chunk: string) => {
    stderr += chunk
  })

  let pendingStatus = ''
  const statusFd = child.stdio[3] as NodeJS.ReadableStream
  statusFd.setEncoding('utf8')
  statusFd.on('data', (chunk: string) => {
    const lines = (pendingStatus + chunk).split('\n')
    pendingStatus = lines.pop()!
    for (const line of lines) {
      const percentage = parseStatusFdLine(line)
      if (percentage !== undefined) {
        onProgress(percentage)
      }
    }
  })

  const exitCode = await new Promise<number | null>((resolve, reject) => {
    child.on('error', reject)
    child.on('close', resolve)
  })

  if (exitCode !== 0) {
    const error = new Error(
      stderr.includes('Could not get lock') || stderr.includes('Unable to acquire')
        ? 'another package operation is in progress'
        : `apt-get failed with exit code ${exitCode}`
    )
    Object.assign(error, { packageName, stderr })
    throw error
  }
  onProgress(100)
}
