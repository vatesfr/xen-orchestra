import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { getChangedPackages, isIgnoredFile } from './check-changed-pkgs.js'

const PACKAGE_NAMES_BY_DIR = new Map([
  ['@vates/types', '@vates/types'],
  ['@xen-orchestra/babel-config', '@xen-orchestra/babel-config'],
  ['@xen-orchestra/backups', '@xen-orchestra/backups'],
  ['@xen-orchestra/lite', '@xen-orchestra/lite'],
  ['packages/xo-server', 'xo-server'],
])

const changedPackages = changedFiles => getChangedPackages(changedFiles, PACKAGE_NAMES_BY_DIR)
const changedPackageNames = changedFiles => Array.from(changedPackages(changedFiles).keys()).sort()

describe('isIgnoredFile', function () {
  for (const file of [
    '@vates/nbd-client/tests/ca-cert.pem',
    // a test file which does not follow the `*.test.*` naming
    '@vates/xml/test/parse.js',
    '@xen-orchestra/backups/_runners/_vmRunners/__snapshots__/IncrementalXapi.mjs.snap',
    '@xen-orchestra/backups/RemoteAdapter.integ.mjs',
    '@xen-orchestra/backups/RemoteAdapter.test.mjs',
    '@xen-orchestra/backups/docs/design.md',
    '@xen-orchestra/backups/README.md',
    '@xen-orchestra/web-core/src/composables/foo.spec.ts',
    // a test directory nested in the package sources
    '@xen-orchestra/web/src/test/create-vm.ts',
    'packages/xo-cli/.USAGE.md',
    'packages/xo-server/.npmignore',
    'packages/xo-server/perf.load.mjs',
    'packages/xo-web/src/common/index.spec.js',
  ]) {
    it(`ignores ${file}`, function () {
      assert.equal(isIgnoredFile(file), true)
    })
  }

  for (const file of [
    '@vates/types/index.mts',
    '@xen-orchestra/backups/RemoteAdapter.mjs',
    '@xen-orchestra/backups/package.json',
    // not a test file, only a file *about* tests
    '@xen-orchestra/backups/testUtils.mjs',
    // `docs` and `test` as file names, not as directories
    'packages/xo-server/docs.md',
    'packages/xo-server/test.mjs',
    'packages/xo-web/src/common/index.js',
  ]) {
    it(`does not ignore ${file}`, function () {
      assert.equal(isIgnoredFile(file), false)
    })
  }
})

describe('getChangedPackages', function () {
  it('maps a file to the package which owns its directory', function () {
    assert.deepEqual(changedPackageNames(['packages/xo-server/src/api/vm.mjs', '@vates/types/index.mts']), [
      '@vates/types',
      'xo-server',
    ])
  })

  it('reports the files which require the release of each package', function () {
    assert.deepEqual(
      Object.fromEntries(
        changedPackages([
          'packages/xo-server/src/api/vm.mjs',
          'packages/xo-server/src/api/vm.spec.mjs',
          'packages/xo-server/package.json',
        ])
      ),
      { 'xo-server': ['packages/xo-server/src/api/vm.mjs', 'packages/xo-server/package.json'] }
    )
  })

  it('ignores files which are not in a package', function () {
    assert.deepEqual(
      changedPackageNames([
        'CHANGELOG.unreleased.md',
        '.github/workflows/ci.yml',
        'scripts/check-changed-pkgs.js',
        'docs/backups.md',
        'packages/not-a-package/index.js',
      ]),
      []
    )
  })

  it('ignores files directly in a package scope directory', function () {
    assert.deepEqual(changedPackageNames(['@vates/README.md', 'packages/tsconfig.json']), [])
  })

  it('ignores packages which are never listed in the changelog', function () {
    assert.deepEqual(
      changedPackageNames([
        '@xen-orchestra/babel-config/index.js',
        '@xen-orchestra/lite/src/App.vue',
        '@vates/types/index.mts',
      ]),
      ['@vates/types']
    )
  })

  it('ignores a package whose changes are limited to ignored files', function () {
    assert.deepEqual(
      changedPackageNames([
        '@xen-orchestra/backups/README.md',
        '@xen-orchestra/backups/tests/fixture.json',
        '@vates/types/types.test.mts',
      ]),
      []
    )
  })

  it('handles an empty list of changed files', function () {
    assert.deepEqual(changedPackageNames([]), [])
  })
})
