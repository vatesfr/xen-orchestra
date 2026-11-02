import type { DebianRelease, DistributionUpgrade } from '@vates/types'
import { readFile } from 'node:fs/promises'
import { parseOsRelease, type OsRelease } from './parse.mjs'

const OS_RELEASE_PATH = '/etc/os-release'

// needed to rewrite the apt sources, a release unknown here is never offered
const DEBIAN_CODENAMES: Record<number, string> = {
  12: 'bookworm',
  13: 'trixie',
  14: 'forky',
  15: 'duke',
}

/**
 * The installed Debian release, undefined on another distribution or on testing/sid (no `VERSION_ID`)
 */
export function getInstalledRelease({ id, versionId, versionCodename }: OsRelease): DebianRelease | undefined {
  if (id !== 'debian' || versionId === undefined || versionCodename === undefined) {
    return undefined
  }
  const parsedVersionId = Number(versionId)
  return Number.isInteger(parsedVersionId) ? { versionId: parsedVersionId, codename: versionCodename } : undefined
}

export async function readInstalledRelease(): Promise<DebianRelease | undefined> {
  return getInstalledRelease(parseOsRelease(await readFile(OS_RELEASE_PATH, 'utf8')))
}

/**
 * Upgrade to the next release only: Debian does not support skipping one, and the target set by Vates is a ceiling,
 * never a release to go back to
 */
export function getDistributionUpgrade({
  installedRelease,
  targetVersionId,
}: {
  readonly installedRelease: DebianRelease | undefined
  readonly targetVersionId: unknown
}): DistributionUpgrade | undefined {
  if (installedRelease === undefined || targetVersionId === undefined) {
    return undefined
  }
  if (typeof targetVersionId !== 'number' || !Number.isInteger(targetVersionId)) {
    throw new Error(`invalid targetDistribution: ${targetVersionId}`)
  }
  if (installedRelease.versionId >= targetVersionId) {
    return undefined
  }

  const nextVersionId = installedRelease.versionId + 1
  const nextCodename = DEBIAN_CODENAMES[nextVersionId]
  if (nextCodename === undefined) {
    throw new Error(`unknown codename of Debian ${nextVersionId}`)
  }
  return { from: installedRelease, to: { versionId: nextVersionId, codename: nextCodename } }
}
