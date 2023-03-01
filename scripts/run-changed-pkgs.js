#!/usr/bin/env node

'use strict'

const { join, relative, sep } = require('path')

const [, , script, ...files] = process.argv

const pkgs = new Set()
const root = join(__dirname, '..')
for (const file of files) {
  const parts = relative(root, file).split(sep)
  if ((parts.length > 2 && parts[0] === 'packages') || parts[0][0] === '@') {
    pkgs.add(parts.slice(0, 2).join(sep))
  }
}

if (pkgs.size !== 0) {
  const args = ['run', '--if-present', script]
  for (const pkg of pkgs) {
    args.push('-w', pkg)
  }

  const { status } = require('child_process').spawnSync('npm', args, { stdio: 'inherit' })
  if (status !== 0) {
    process.exit(status)
  }
}
