#!/usr/bin/env node

'use strict'

// eslint-disable-next-line n/no-unsupported-features/node-builtins
const { closeSync, openSync, readFileSync, rmSync, unlinkSync } = require('fs')
const { join } = require('path')
const { spawnSync } = require('child_process')

const ROOT = join(__dirname, '..')

// tarball extracted at each build and not locked in yarn because completely autonom
// removed to avoid conflicts inside sbom generation
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
