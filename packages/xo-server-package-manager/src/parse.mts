import type { UpgradablePackage } from '@vates/types'
import type { RequiredAction, UpgradeProgress } from './types.mjs'
import { access } from 'node:fs/promises'

/**
 * Parse the output of `apt list --upgradable`.
 *
 * Each line has the format:
 *   package/source1,source2 version arch [upgradable from: oldVersion]
 *
 * Example:
 *   libgnutls30/stable 3.7.1-5+deb12u6 amd64 [upgradable from: 3.7.1-5+deb12u5]
 */
export function parseUpgradableList(stdout: string): Partial<UpgradablePackage>[] {
  const results: Partial<UpgradablePackage>[] = []

  for (const line of stdout.split('\n')) {
    // Skip empty lines and the "Listing..." header
    if (line === '' || line.startsWith('Listing...') || line.startsWith('WARNING')) {
      continue
    }

    // Format: name/release version arch [upgradable from: installedVersion]
    const match = line.match(/^([^/]+)\/(\S+)\s+(\S+)\s+\S+\s+\[upgradable from:\s+(\S+)]/)
    if (match === null) {
      continue
    }

    const [, name, release, version, installedVersion] = match
    results.push({
      name: name!,
      release: release!,
      version: version!,
      installedVersion: installedVersion!,
    })
  }

  return results
}

/**
 * Parse the output of `apt-cache show pkg1 pkg2 ...`.
 *
 * Each package block is separated by a blank line.
 * We extract Description, Size, and the source repository (from APT-Sources or Filename).
 */
export function parseAptCacheShow(
  stdout: string
): Map<string, { description: string; size: number; sourceRepository: string }> {
  const results = new Map<string, { description: string; size: number; sourceRepository: string }>()

  // Split by double newline to get individual package blocks
  const blocks = stdout.split(/\n\n+/)

  for (const block of blocks) {
    if (block.trim() === '') {
      continue
    }

    let name = ''
    let description = ''
    let size = 0
    let sourceRepository = ''

    for (const line of block.split('\n')) {
      if (line.startsWith('Package: ')) {
        name = line.slice('Package: '.length).trim()
      } else if (description === '' && (line.startsWith('Description: ') || line.startsWith('Description-en: '))) {
        // Debian 13+ uses Description-en instead of Description
        const prefix = line.startsWith('Description-en: ') ? 'Description-en: ' : 'Description: '
        description = line.slice(prefix.length).trim()
      } else if (line.startsWith('Size: ')) {
        size = parseInt(line.slice('Size: '.length).trim(), 10) || 0
      } else if (line.startsWith('APT-Sources: ')) {
        // APT-Sources: http://deb.debian.org/debian bookworm/main amd64 Packages
        const src = line.slice('APT-Sources: '.length).trim()
        sourceRepository = src.split(' ')[0] ?? ''
      } else if (sourceRepository === '' && line.startsWith('Filename: ')) {
        // Fallback: extract from Filename if APT-Sources is not present
        sourceRepository = line.slice('Filename: '.length).trim()
      }
    }

    if (name !== '') {
      // Only store the first entry per package name (latest version)
      if (!results.has(name)) {
        results.set(name, { description, size, sourceRepository })
      }
    }
  }

  return results
}

/**
 * Parse a single line from apt's Status-Fd stream.
 *
 * Format: pmstatus:package:percentage:message
 * Example: pmstatus:libgnutls30:50.0000:Installing libgnutls30 (amd64)...
 */
export function parseStatusFdLine(line: string): UpgradeProgress | undefined {
  if (!line.startsWith('pmstatus:')) {
    return undefined
  }

  const parts = line.split(':')
  if (parts.length < 4) {
    return undefined
  }

  const currentPackage = parts[1]!
  const percentage = parseFloat(parts[2]!)

  if (isNaN(percentage)) {
    return undefined
  }

  return {
    status: 'running',
    currentPackage,
    percentage: Math.round(percentage * 100) / 100,
  }
}

const REBOOT_REQUIRED_PATH = '/var/run/reboot-required'

/**
 * Detect what action is required after upgrading a set of packages.
 *
 * Priority:
 * 1. /var/run/reboot-required exists → restartSystem
 * 2. xo-server or node was upgraded → restartXoServer
 * 3. Otherwise → none
 */
export async function detectRequiredAction(packagesUpgraded: string[]): Promise<RequiredAction> {
  // Check if a reboot is required
  try {
    await access(REBOOT_REQUIRED_PATH)
    return 'restartSystem'
  } catch {
    // file does not exist — continue
  }

  // Check if xo-server-related packages were upgraded
  const xoServerPackages = ['xo-server', 'xo-server-compact', 'nodejs', 'node']
  for (const pkg of packagesUpgraded) {
    if (xoServerPackages.includes(pkg)) {
      return 'restartXoServer'
    }
  }

  return 'none'
}
