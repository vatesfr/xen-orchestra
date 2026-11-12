import type { KubernetesReleaseGroup } from '@/modules/kubernetes/remote-resources/use-xo-kubernetes-release-collection.ts'

export type KubernetesVersionOption = {
  value: string
  label: string
  // Minor version the release belongs to, displayed as a separator in the select dropdown
  group?: string
}

function toVersionNumbers(version: string): number[] {
  return version
    .replace(/^v/, '')
    .split('.')
    .map(part => Number.parseInt(part, 10) || 0)
}

/**
 * Compares two Kubernetes versions, with or without the "v" prefix (e.g. `v1.34.2` and `1.34.10`)
 * Returns a negative number if `a` is older than `b`, a positive number if it is newer, 0 if they are equal
 */
export function compareKubernetesVersions(a: string, b: string): number {
  const aNumbers = toVersionNumbers(a)
  const bNumbers = toVersionNumbers(b)

  for (let index = 0; index < Math.max(aNumbers.length, bNumbers.length); index++) {
    const difference = (aNumbers[index] ?? 0) - (bNumbers[index] ?? 0)

    if (difference !== 0) {
      return difference
    }
  }

  return 0
}

export function highestKubernetesVersion(versions: string[]): string | undefined {
  return versions.reduce<string | undefined>(
    (highest, version) =>
      highest === undefined || compareKubernetesVersions(version, highest) > 0 ? version : highest,
    undefined
  )
}

/**
 * Flattens the release groups into select options, keeping only the releases matching the optional predicate
 * CAPI expects releases without the "v" prefix, which is only added for display
 */
export function toKubernetesVersionOptions(
  releaseGroups: KubernetesReleaseGroup[],
  predicate: (release: string) => boolean = () => true
): KubernetesVersionOption[] {
  return releaseGroups.flatMap(({ version, releases }) =>
    releases.filter(predicate).map(release => ({ value: release, label: `v${release}`, group: `v${version}` }))
  )
}
