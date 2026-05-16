/**
 * Integration tests for AptPackageManager.
 *
 * Requires:
 * - Running on a Debian system with apt available
 * - Root access (sudo)
 * - TEST_STATE_DIR env var (defaults to /tmp/xo-pkg-mgr-test)
 *
 * Run: sudo node --test apt.integ.mjs
 */
import assert from 'node:assert/strict'
import { describe, it, before, after } from 'node:test'
import { mkdir, rm, readFile } from 'node:fs/promises'
import { AptPackageManager } from './apt.mjs'

const STATE_DIR = process.env.TEST_STATE_DIR ?? '/tmp/xo-pkg-mgr-test'

describe('AptPackageManager integration', () => {
  let apt: AptPackageManager

  before(async () => {
    await rm(STATE_DIR, { recursive: true, force: true })
    await mkdir(STATE_DIR, { recursive: true })
    apt = new AptPackageManager(STATE_DIR)
  })

  after(async () => {
    await rm(STATE_DIR, { recursive: true, force: true })
  })

  it('checkAvailable does not throw on a Debian system', () => {
    apt.checkAvailable()
  })

  it('listUpgradable returns structured packages with all fields', async () => {
    const packages = await apt.listUpgradable()

    console.log(`Found ${packages.length} upgradable packages`)

    assert.ok(packages.length > 0, 'Expected at least one upgradable package')

    for (const pkg of packages) {
      assert.ok(pkg.name, `Package name should not be empty`)
      assert.ok(pkg.version, `Version should not be empty for ${pkg.name}`)
      assert.ok(pkg.installedVersion, `Installed version should not be empty for ${pkg.name}`)
      assert.ok(pkg.release, `Release should not be empty for ${pkg.name}`)
      assert.equal(typeof pkg.description, 'string')
      assert.equal(typeof pkg.size, 'number')
      assert.equal(typeof pkg.sourceRepository, 'string')
    }

    const sample = packages[0]!
    console.log('Sample package:', JSON.stringify(sample, null, 2))
  })

  it('upgrade a single safe package with progress tracking', async () => {
    const packages = await apt.listUpgradable()
    const tzdata = packages.find(p => p.name === 'tzdata')
    const target = tzdata ?? packages.find(p => p.name === 'distro-info-data') ?? packages[0]

    if (target === undefined) {
      console.log('SKIP: no upgradable packages available')
      return
    }

    console.log(`Upgrading: ${target.name} ${target.installedVersion} → ${target.version}`)

    const result = await apt.upgrade([target.name])

    console.log('Result:', JSON.stringify(result, null, 2))

    assert.ok(result.success, 'Upgrade should succeed')
    assert.ok(result.packagesUpgraded.length > 0, 'At least one package should be upgraded')
    assert.ok(result.logFile, 'Log file should be set')
    assert.ok(
      ['none', 'restartServices', 'restartXoServer', 'restartSystem'].includes(result.requiredAction),
      'requiredAction should be valid'
    )

    const logContent = await readFile(result.logFile, 'utf-8')
    assert.ok(logContent.length > 0, 'Log file should have content')
    console.log(`Log file: ${result.logFile} (${logContent.length} bytes)`)
  })

  it('rejects concurrent operations', async () => {
    // Start an upgrade that will fail (nonexistent package) — it sets #isRunning = true
    // synchronously before suspending on spawn, so the second call hits the guard.
    const firstP = apt.upgrade(['xo-pkg-mgr-test-nonexistent-package']).catch(() => {})
    await assert.rejects(
      () => apt.upgrade(['xo-pkg-mgr-test-nonexistent-package']),
      (err: Error) => {
        assert.ok(err.message.includes('already in progress'))
        return true
      }
    )
    await firstP
  })
})
