import type { UpgradablePackage } from '@vates/types'

export type ListedPackage = Omit<UpgradablePackage, 'description'>

/**
 * Parse the output of `apt list --upgradable`
 *
 * Each line has the format:
 *   name/release1,release2 version arch [upgradable from: installedVersion]
 *
 * Example:
 *   libgnutls30/stable 3.7.1-5+deb12u6 amd64 [upgradable from: 3.7.1-5+deb12u5]
 */
export function parseUpgradableList(stdout: string): ListedPackage[] {
  const listedPackages: ListedPackage[] = []
  for (const line of stdout.split('\n')) {
    // other lines ("Listing...", warnings, empty) are ignored
    const match = line.match(/^([^/]+)\/(\S+)\s+(\S+)\s+\S+\s+\[upgradable from:\s+(\S+)]/)
    if (match === null) {
      continue
    }

    const [, name, release, version, installedVersion] = match as [string, string, string, string, string]
    listedPackages.push({ name, release, version, installedVersion })
  }
  return listedPackages
}

/**
 * Parse the output of `apt-cache show pkg1 pkg2 ...` into a map of package name → short description
 *
 * Package blocks are separated by a blank line, the first block of a package is the candidate version.
 */
export function parseDescriptions(stdout: string): Map<string, string> {
  const descriptions = new Map<string, string>()
  for (const block of stdout.split(/\n\n+/)) {
    let name: string | undefined
    let description = ''
    for (const line of block.split('\n')) {
      // Debian 13+ uses Description-en instead of Description
      const match = line.match(/^(Package|Description|Description-en): (.*)$/)
      if (match === null) {
        continue
      }
      const [, field, value] = match as [string, string, string]
      if (field === 'Package') {
        name = value.trim()
      } else if (description === '') {
        description = value.trim()
      }
    }

    if (name !== undefined && !descriptions.has(name)) {
      descriptions.set(name, description)
    }
  }
  return descriptions
}

export type AptPhase = 'download' | 'install'

export type StatusFdProgress = {
  phase: AptPhase
  percentage: number
}

export type AptStatus = StatusFdProgress & {
  /** name of the package for the installation, number of the file for the download */
  item: string
  message: string
  /** apt reports the failure of the installation of this package */
  isError: boolean
}

const PHASE_BY_STATUS_TYPE: Record<string, AptPhase> = { dlstatus: 'download', pmstatus: 'install', pmerror: 'install' }

/**
 * Parse a line of apt's Status-Fd stream, each percentage is the progress of the whole phase
 *
 * Format: type:item:percentage:message
 * Examples:
 *   dlstatus:3:21.4667:Retrieving file 3 of 4
 *   pmstatus:libgnutls30:50.0000:Installing libgnutls30 (amd64)
 *   pmerror:curl:60.0000:installed curl package post-installation script subprocess returned error exit status 1
 *
 * The package is named without its architecture, even a foreign one.
 */
export function parseStatusFdLine(line: string): AptStatus | undefined {
  const match = line.match(/^([^:]+):([^:]+):([^:]+):(.*)$/)
  if (match === null) {
    return undefined
  }

  const [, type, item, percentage, message] = match as [string, string, string, string, string]
  const phase = PHASE_BY_STATUS_TYPE[type]
  const parsedPercentage = parseFloat(percentage)
  if (phase === undefined || isNaN(parsedPercentage)) {
    return undefined
  }

  return {
    phase,
    percentage: Math.round(parsedPercentage * 100) / 100,
    item,
    message,
    isError: type === 'pmerror',
  }
}

/**
 * Combine the progress of a phase into the progress of the whole operation
 *
 * The download and the installation are half of the progress each, unless nothing has been downloaded (packages
 * already in the cache): the installation is then the whole progress.
 */
export function getOverallPercentage({ phase, percentage }: StatusFdProgress, hasDownloaded: boolean): number {
  if (phase === 'download') {
    return percentage / 2
  }
  return hasDownloaded ? 50 + percentage / 2 : percentage
}
