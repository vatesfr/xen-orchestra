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

/**
 * Parse a line of apt's Status-Fd stream and return the overall percentage
 *
 * Format: pmstatus:package:percentage:message
 * Example: pmstatus:libgnutls30:50.0000:Installing libgnutls30 (amd64)...
 */
export function parseStatusFdLine(line: string): number | undefined {
  const [type, , percentage] = line.split(':')
  if (type !== 'pmstatus' || percentage === undefined) {
    return undefined
  }

  const parsedPercentage = parseFloat(percentage)
  return isNaN(parsedPercentage) ? undefined : Math.round(parsedPercentage * 100) / 100
}
