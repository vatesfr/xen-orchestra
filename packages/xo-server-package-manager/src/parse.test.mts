import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { parseUpgradableList, parseAptCacheShow, parseStatusFdLine, detectRequiredAction } from './parse.mjs'

// =============================================================================
// parseUpgradableList
// =============================================================================

describe('parseUpgradableList', () => {
  it('returns empty array for empty input', () => {
    assert.deepStrictEqual(parseUpgradableList(''), [])
  })

  it('returns empty array for "Listing..." only', () => {
    assert.deepStrictEqual(parseUpgradableList('Listing...\n'), [])
  })

  it('parses a single upgradable package', () => {
    const input = `Listing...
libgnutls30/stable 3.7.1-5+deb12u6 amd64 [upgradable from: 3.7.1-5+deb12u5]
`
    const result = parseUpgradableList(input)
    assert.equal(result.length, 1)
    assert.deepStrictEqual(result[0], {
      name: 'libgnutls30',
      release: 'stable',
      version: '3.7.1-5+deb12u6',
      installedVersion: '3.7.1-5+deb12u5',
    })
  })

  it('parses multiple upgradable packages', () => {
    const input = `Listing...
libgnutls30/stable 3.7.1-5+deb12u6 amd64 [upgradable from: 3.7.1-5+deb12u5]
curl/stable-security 7.88.1-10+deb12u8 amd64 [upgradable from: 7.88.1-10+deb12u7]
`
    const result = parseUpgradableList(input)
    assert.equal(result.length, 2)
    assert.equal(result[0]!.name, 'libgnutls30')
    assert.equal(result[1]!.name, 'curl')
  })

  it('handles multiple sources (comma-separated release)', () => {
    const input = `Listing...
linux-image-amd64/stable,stable-security 6.1.119-1 amd64 [upgradable from: 6.1.112-1]
`
    const result = parseUpgradableList(input)
    assert.equal(result.length, 1)
    assert.equal(result[0]!.release, 'stable,stable-security')
    assert.equal(result[0]!.version, '6.1.119-1')
  })

  it('skips malformed lines gracefully', () => {
    const input = `Listing...
this is not a valid line
libgnutls30/stable 3.7.1-5+deb12u6 amd64 [upgradable from: 3.7.1-5+deb12u5]
another bad line
`
    const result = parseUpgradableList(input)
    assert.equal(result.length, 1)
    assert.equal(result[0]!.name, 'libgnutls30')
  })

  it('skips WARNING lines', () => {
    const input = `WARNING: apt does not have a stable CLI interface. Use with caution in scripts.
Listing...
curl/stable 7.88.1-10+deb12u8 amd64 [upgradable from: 7.88.1-10+deb12u7]
`
    const result = parseUpgradableList(input)
    assert.equal(result.length, 1)
    assert.equal(result[0]!.name, 'curl')
  })
})

// =============================================================================
// parseAptCacheShow
// =============================================================================

describe('parseAptCacheShow', () => {
  it('returns empty map for empty input', () => {
    const result = parseAptCacheShow('')
    assert.equal(result.size, 0)
  })

  it('parses a single package', () => {
    const input = `Package: curl
Version: 7.88.1-10+deb12u8
Description: command line tool for transferring data with URL syntax
Size: 443824
APT-Sources: http://deb.debian.org/debian bookworm/main amd64 Packages
`
    const result = parseAptCacheShow(input)
    assert.equal(result.size, 1)
    const curl = result.get('curl')
    assert.ok(curl)
    assert.equal(curl.description, 'command line tool for transferring data with URL syntax')
    assert.equal(curl.size, 443824)
    assert.equal(curl.sourceRepository, 'http://deb.debian.org/debian')
  })

  it('parses multiple packages', () => {
    const input = `Package: curl
Version: 7.88.1-10+deb12u8
Description: command line tool for transferring data
Size: 443824
APT-Sources: http://deb.debian.org/debian bookworm/main amd64 Packages

Package: libgnutls30
Version: 3.7.1-5+deb12u6
Description: GNU TLS library
Size: 1234567
APT-Sources: http://security.debian.org/debian-security bookworm-security/main amd64 Packages
`
    const result = parseAptCacheShow(input)
    assert.equal(result.size, 2)
    assert.equal(result.get('curl')!.description, 'command line tool for transferring data')
    assert.equal(result.get('libgnutls30')!.sourceRepository, 'http://security.debian.org/debian-security')
  })

  it('handles missing fields with fallback defaults', () => {
    const input = `Package: minimal-pkg
Version: 1.0
`
    const result = parseAptCacheShow(input)
    const pkg = result.get('minimal-pkg')
    assert.ok(pkg)
    assert.equal(pkg.description, '')
    assert.equal(pkg.size, 0)
    assert.equal(pkg.sourceRepository, '')
  })

  it('falls back to Filename when APT-Sources is missing', () => {
    const input = `Package: local-pkg
Version: 1.0
Description: a local package
Size: 100
Filename: pool/main/l/local-pkg/local-pkg_1.0_amd64.deb
`
    const result = parseAptCacheShow(input)
    assert.equal(result.get('local-pkg')!.sourceRepository, 'pool/main/l/local-pkg/local-pkg_1.0_amd64.deb')
  })

  it('handles Description-en field (Debian 13+)', () => {
    const input = `Package: curl
Version: 8.14.1-2+deb13u2
Description-en: command line tool for transferring data with URL syntax
Size: 281912
Filename: pool/main/c/curl/curl_8.14.1-2+deb13u2_amd64.deb
`
    const result = parseAptCacheShow(input)
    assert.equal(result.get('curl')!.description, 'command line tool for transferring data with URL syntax')
  })

  it('keeps only first entry when package appears multiple times', () => {
    const input = `Package: curl
Version: 7.88.1-10+deb12u8
Description: newer version
Size: 500000
APT-Sources: http://deb.debian.org/debian bookworm/main amd64 Packages

Package: curl
Version: 7.88.1-10+deb12u7
Description: older version
Size: 490000
APT-Sources: http://deb.debian.org/debian bookworm/main amd64 Packages
`
    const result = parseAptCacheShow(input)
    assert.equal(result.size, 1)
    assert.equal(result.get('curl')!.description, 'newer version')
  })
})

// =============================================================================
// parseStatusFdLine
// =============================================================================

describe('parseStatusFdLine', () => {
  it('returns undefined for non-pmstatus lines', () => {
    assert.equal(parseStatusFdLine('dlstatus:1:0:Downloading libgnutls30'), undefined)
    assert.equal(parseStatusFdLine(''), undefined)
    assert.equal(parseStatusFdLine('some random text'), undefined)
  })

  it('parses a valid pmstatus line', () => {
    const result = parseStatusFdLine('pmstatus:libgnutls30:50.0000:Installing libgnutls30 (amd64)...')
    assert.ok(result)
    assert.equal(result.status, 'running')
    assert.equal(result.currentPackage, 'libgnutls30')
    assert.equal(result.percentage, 50)
  })

  it('handles 0% progress', () => {
    const result = parseStatusFdLine('pmstatus:curl:0.0000:Preparing curl (amd64)...')
    assert.ok(result)
    assert.equal(result.percentage, 0)
    assert.equal(result.currentPackage, 'curl')
  })

  it('handles 100% progress', () => {
    const result = parseStatusFdLine('pmstatus:curl:100.0000:Installed curl (amd64)')
    assert.ok(result)
    assert.equal(result.percentage, 100)
  })

  it('returns undefined for malformed pmstatus with missing parts', () => {
    assert.equal(parseStatusFdLine('pmstatus:curl'), undefined)
    assert.equal(parseStatusFdLine('pmstatus:curl:notanumber:msg'), undefined)
  })
})

// =============================================================================
// detectRequiredAction
// =============================================================================

describe('detectRequiredAction', () => {
  it('returns "none" or "restartSystem" for unrelated packages', async () => {
    const result = await detectRequiredAction(['curl', 'libgnutls30'])
    // If /var/run/reboot-required exists on the test machine, restartSystem is returned.
    // Otherwise, none is returned. Both are correct behavior.
    assert.ok(result === 'none' || result === 'restartSystem')
    // Crucially, it should NOT return restartXoServer for unrelated packages
    assert.notEqual(result, 'restartXoServer')
  })

  it('returns "restartXoServer" when xo-server is upgraded', async () => {
    // This test only works when /var/run/reboot-required does NOT exist.
    // If it does, restartSystem takes priority (which is correct behavior).
    const result = await detectRequiredAction(['xo-server', 'curl'])
    assert.ok(result === 'restartXoServer' || result === 'restartSystem')
  })

  it('returns "restartXoServer" when nodejs is upgraded', async () => {
    const result = await detectRequiredAction(['libssl3', 'nodejs'])
    assert.ok(result === 'restartXoServer' || result === 'restartSystem')
  })
})
