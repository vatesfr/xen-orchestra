import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { getDistributionUpgrade, getInstalledRelease } from './distribution.mjs'

const BOOKWORM = { versionId: 12, codename: 'bookworm' }

describe('getInstalledRelease', () => {
  it('returns the Debian release', () => {
    assert.deepStrictEqual(
      getInstalledRelease({ id: 'debian', versionId: '12', versionCodename: 'bookworm' }),
      BOOKWORM
    )
  })

  it('returns undefined on another distribution', () => {
    assert.equal(getInstalledRelease({ id: 'ubuntu', versionId: '24.04', versionCodename: 'noble' }), undefined)
  })

  it('returns undefined on Debian testing', () => {
    assert.equal(getInstalledRelease({ id: 'debian', versionId: undefined, versionCodename: 'forky' }), undefined)
  })
})

describe('getDistributionUpgrade', () => {
  it('offers the next release when the target is the next one', () => {
    assert.deepStrictEqual(getDistributionUpgrade({ installedRelease: BOOKWORM, targetVersionId: 13 }), {
      from: BOOKWORM,
      to: { versionId: 13, codename: 'trixie' },
    })
  })

  it('offers only the next release when the target is further', () => {
    assert.deepStrictEqual(getDistributionUpgrade({ installedRelease: BOOKWORM, targetVersionId: 14 })?.to, {
      versionId: 13,
      codename: 'trixie',
    })
  })

  it('offers nothing when the installed release is the target', () => {
    assert.equal(getDistributionUpgrade({ installedRelease: BOOKWORM, targetVersionId: 12 }), undefined)
  })

  it('offers nothing when the installed release is newer than the target', () => {
    assert.equal(getDistributionUpgrade({ installedRelease: BOOKWORM, targetVersionId: 11 }), undefined)
  })

  it('offers nothing without a target', () => {
    assert.equal(getDistributionUpgrade({ installedRelease: BOOKWORM, targetVersionId: undefined }), undefined)
  })

  it('offers nothing without an installed Debian release', () => {
    assert.equal(getDistributionUpgrade({ installedRelease: undefined, targetVersionId: 13 }), undefined)
  })

  it('throws on an invalid target', () => {
    assert.throws(() => getDistributionUpgrade({ installedRelease: BOOKWORM, targetVersionId: 'trixie' }), /invalid/)
  })

  it('throws when the codename of the next release is unknown', () => {
    assert.throws(
      () => getDistributionUpgrade({ installedRelease: { versionId: 15, codename: 'duke' }, targetVersionId: 16 }),
      /unknown codename of Debian 16/
    )
  })
})
