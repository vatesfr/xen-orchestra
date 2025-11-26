#!/usr/bin/env node

'use strict'

const { join, relative, sep } = require('path')

const [, , script, ...files] = process.argv
console.log(script, files)

const root = join(__dirname, '..')
for (const file of files) {
  console.log('file', file)
  if (file === 'CHANGELOG.unreleased.md') {
    const parts = relative(root, file).split(sep)
    console.log(parts)
  }
}

// if (pkgs.size !== 0) {
//   const args = ['run', '--if-present', script]
//   for (const pkg of pkgs) {
//     args.push('-w', pkg)
//   }

//   const { status } = require('child_process').spawnSync('npm', args, { stdio: 'inherit' })
//   if (status !== 0) {
//     process.exit(status)
//   }
// }
