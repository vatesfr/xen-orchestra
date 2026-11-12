import {
  compareKubernetesVersions,
  highestKubernetesVersion,
  toKubernetesVersionOptions,
} from '@/modules/kubernetes/utils/kubernetes-version.util.ts'

describe('compareKubernetesVersions', () => {
  it.each([
    ['1.34.2', '1.34.2'],
    ['v1.34.2', '1.34.2'],
    ['1.34', '1.34.0'],
  ])('returns 0 for %s and %s', (a, b) => {
    expect(compareKubernetesVersions(a, b)).toBe(0)
  })

  it.each([
    ['1.34.10', '1.34.9'],
    ['1.35.0', '1.34.12'],
    ['2.0.0', '1.99.99'],
    ['v1.34.3', '1.34.2'],
  ])('returns a positive number when %s is newer than %s', (a, b) => {
    expect(compareKubernetesVersions(a, b)).toBeGreaterThan(0)
    expect(compareKubernetesVersions(b, a)).toBeLessThan(0)
  })
})

describe('highestKubernetesVersion', () => {
  it('returns undefined for an empty list', () => {
    expect(highestKubernetesVersion([])).toBeUndefined()
  })

  it('returns the highest version, compared numerically', () => {
    expect(highestKubernetesVersion(['v1.34.9', 'v1.34.10', 'v1.33.12'])).toBe('v1.34.10')
  })
})

describe('toKubernetesVersionOptions', () => {
  const releaseGroups = [
    { version: '1.34', releases: ['1.34.3', '1.34.2'] },
    { version: '1.33', releases: ['1.33.7'] },
  ]

  it('flattens the release groups into options grouped by minor version', () => {
    expect(toKubernetesVersionOptions(releaseGroups)).toEqual([
      { value: '1.34.3', label: 'v1.34.3', group: 'v1.34' },
      { value: '1.34.2', label: 'v1.34.2', group: 'v1.34' },
      { value: '1.33.7', label: 'v1.33.7', group: 'v1.33' },
    ])
  })

  it('keeps only the releases matching the predicate', () => {
    expect(
      toKubernetesVersionOptions(releaseGroups, release => compareKubernetesVersions(release, '1.34.2') > 0)
    ).toEqual([{ value: '1.34.3', label: 'v1.34.3', group: 'v1.34' }])
  })
})
