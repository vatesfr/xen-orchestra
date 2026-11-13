/**
 * Integration tests of the apt wrapper
 *
 * Requires a Debian system with apt and root access, upgrades one real package
 *
 * Run: sudo node --test dist/apt.integ.mjs
 */
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { checkAptAvailable, listUpgradablePackages, upgradePackages } from './apt.mjs'

describe('apt', () => {
  it('checkAptAvailable does not throw on a Debian system', async () => {
    await checkAptAvailable()
  })

  it('listUpgradablePackages returns packages with all fields', async () => {
    for (const pkg of await listUpgradablePackages()) {
      assert.ok(pkg.name !== '')
      assert.ok(pkg.version !== '', `version of ${pkg.name}`)
      assert.ok(pkg.installedVersion !== '', `installed version of ${pkg.name}`)
      assert.ok(pkg.release !== '', `release of ${pkg.name}`)
      assert.equal(typeof pkg.description, 'string')
    }
  })

  it('upgrades a single package and reports progress', async t => {
    const packages = await listUpgradablePackages()
    const target = packages.find(p => p.name === 'tzdata') ?? packages.find(p => p.name === 'distro-info-data')
    if (target === undefined) {
      t.skip('no safe package to upgrade')
      return
    }

    const progresses: number[] = []
    await upgradePackages({ packageName: target.name, onProgress: percentage => progresses.push(percentage) })

    assert.equal(progresses.at(-1), 100)
    assert.equal(
      (await listUpgradablePackages()).find(p => p.name === target.name),
      undefined
    )
  })

  it('rejects an invalid package name', async () => {
    await assert.rejects(
      upgradePackages({ packageName: '-oAPT::foo=bar', onProgress: () => {} }),
      /invalid package name/
    )
  })
})
