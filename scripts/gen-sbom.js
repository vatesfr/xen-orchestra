#!/usr/bin/env node

'use strict'

// Generates a CycloneDX SBOM of the production dependency tree, via `npm sbom`.
//
// `npm sbom` refuses to emit anything (ESBOMPROBLEMS) when a node of the
// installed tree does not satisfy the range that requires it, no flag can ignore it,
// so two fixes here:
//
// - `react-bootstrap-4@0.29.1` ships its own `node_modules` inside its tarball,
//   so `history@1.17.0` is extracted on every install while belonging to no
//   lockfile entry, and its `query-string@^3` is served by the hoisted 4.x.
//   `history` is only one of its devDependencies, so remove it.
//
// - `@intlify/vue-i18n-extensions@8.0.0`: only used by devDependencies of `@xen-orchestra/lite`
//   and `@xen-orchestra/web`, so `--omit dev` leaves them out.
//
// eslint-disable-next-line n/no-unsupported-features/node-builtins
const { closeSync, openSync, readFileSync, rmSync, unlinkSync } = require('fs')
const { join } = require('path')
const { spawnSync } = require('child_process')

const ROOT = join(__dirname, '..')

const BUNDLED_DEPS_TO_REMOVE = ['react-bootstrap-4/node_modules/history']

function main([output = 'xo.cdx.json']) {
  for (const path of BUNDLED_DEPS_TO_REMOVE) {
    rmSync(join(ROOT, 'node_modules', path), { force: true, recursive: true })
  }

  const path = join(ROOT, output)
  const fd = openSync(path, 'w')
  let status
  try {
    ;({ status } = spawnSync(
      'npm',
      ['sbom', '--sbom-format', 'cyclonedx', '--sbom-type', 'application', '--omit', 'dev'],
      { cwd: ROOT, stdio: ['ignore', fd, 'inherit'] }
    ))
  } finally {
    closeSync(fd)
  }

  if (status !== 0) {
    unlinkSync(path)
    process.exit(status ?? 1)
  }

  const { components } = JSON.parse(readFileSync(path, 'utf8'))
  console.log(`${output}: ${components.length} components`)
}

main(process.argv.slice(2))
