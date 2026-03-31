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
import { mkdir, rm, readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
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

  it('checkAptAvailable does not throw on a Debian system', () => {
    apt.checkAptAvailable()
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
      // description and size may be empty for some packages, but type should be correct
      assert.equal(typeof pkg.description, 'string')
      assert.equal(typeof pkg.size, 'number')
      assert.equal(typeof pkg.sourceRepository, 'string')
    }

    // Print a sample for visual inspection
    const sample = packages[0]!
    console.log('Sample package:', JSON.stringify(sample, null, 2))
  })

  it('getOperationStatus returns null when idle', () => {
    const status = apt.getOperationStatus()
    assert.equal(status, null)
  })

  it('upgrade a single safe package with progress tracking', async () => {
    // Pick a small, safe package to upgrade — tzdata is a good candidate
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

    // Verify log file exists and has content
    const logContent = await readFile(result.logFile, 'utf-8')
    assert.ok(logContent.length > 0, 'Log file should have content')
    console.log(`Log file: ${result.logFile} (${logContent.length} bytes)`)

    // Verify state files are cleaned up
    const status = apt.getOperationStatus()
    assert.equal(status, null, 'Operation status should be null after completion')
  })

  it('rejects concurrent operations', async () => {
    // This test is tricky — we'd need to start a long upgrade and try another.
    // Instead, we test the state machine by manually writing a fake pid file.
    const { writeFile: wf } = await import('node:fs/promises')
    const fakeState = {
      pid: process.pid, // current process — alive
      startedAt: Date.now(),
      operation: 'upgrade',
    }
    await wf(join(STATE_DIR, 'operation.json'), JSON.stringify(fakeState))

    await assert.rejects(
      () => apt.upgrade(['curl']),
      (err: Error) => {
        assert.ok(err.message.includes('already in progress'))
        return true
      }
    )

    // Clean up fake state
    await rm(join(STATE_DIR, 'operation.json'), { force: true })
  })

  it('detects interrupted operation from stale pid file', async () => {
    // Write a pid file with a dead pid
    const { writeFile: wf } = await import('node:fs/promises')
    const fakeState = {
      pid: 999999, // almost certainly dead
      startedAt: Date.now() - 60000,
      operation: 'systemUpgrade' as const,
    }
    await wf(join(STATE_DIR, 'operation.json'), JSON.stringify(fakeState))

    const status = apt.getOperationStatus()
    assert.ok(status !== null, 'Should detect stale operation')
    assert.equal(status!.progress?.status, 'interrupted')
    assert.equal(status!.operation, 'systemUpgrade')
    console.log('Interrupted status:', JSON.stringify(status, null, 2))

    // cleanupStaleOperation should clean it up
    const stale = await apt.cleanupStaleOperation()
    assert.ok(stale !== undefined, 'Should return the stale operation')
    assert.equal(stale!.operation, 'systemUpgrade')

    // After cleanup, should be null
    const afterCleanup = apt.getOperationStatus()
    assert.equal(afterCleanup, null, 'Should be null after cleanup')
  })
})
