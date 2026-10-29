import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { parseDescriptions, parseStatusFdLine, parseUpgradableList } from './parse.mjs'

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
// parseDescriptions
// =============================================================================

describe('parseDescriptions', () => {
  it('returns empty map for empty input', () => {
    assert.equal(parseDescriptions('').size, 0)
  })

  it('parses multiple packages', () => {
    const input = `Package: curl
Version: 7.88.1-10+deb12u8
Description: command line tool for transferring data
Size: 443824

Package: libgnutls30
Version: 3.7.1-5+deb12u6
Description: GNU TLS library
`
    assert.deepStrictEqual(
      parseDescriptions(input),
      new Map([
        ['curl', 'command line tool for transferring data'],
        ['libgnutls30', 'GNU TLS library'],
      ])
    )
  })

  it('defaults to an empty description', () => {
    assert.equal(parseDescriptions('Package: minimal-pkg\nVersion: 1.0\n').get('minimal-pkg'), '')
  })

  it('handles Description-en field (Debian 13+)', () => {
    const input = `Package: curl
Version: 8.14.1-2+deb13u2
Description-en: command line tool for transferring data with URL syntax
`
    assert.equal(parseDescriptions(input).get('curl'), 'command line tool for transferring data with URL syntax')
  })

  it('keeps only first entry when package appears multiple times', () => {
    const input = `Package: curl
Version: 7.88.1-10+deb12u8
Description: newer version

Package: curl
Version: 7.88.1-10+deb12u7
Description: older version
`
    assert.deepStrictEqual(parseDescriptions(input), new Map([['curl', 'newer version']]))
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

  it('parses the percentage', () => {
    assert.equal(parseStatusFdLine('pmstatus:libgnutls30:50.0000:Installing libgnutls30 (amd64)...'), 50)
    assert.equal(parseStatusFdLine('pmstatus:curl:0.0000:Preparing curl (amd64)...'), 0)
    assert.equal(parseStatusFdLine('pmstatus:curl:33.3333:Unpacking curl (amd64)'), 33.33)
  })

  it('returns undefined for malformed pmstatus lines', () => {
    assert.equal(parseStatusFdLine('pmstatus:curl'), undefined)
    assert.equal(parseStatusFdLine('pmstatus:curl:notanumber:msg'), undefined)
  })
})
