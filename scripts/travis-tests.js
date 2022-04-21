#!/usr/bin/env node

'use strict'

const { execFileSync, spawnSync } = require('child_process')

const run = (command, args) => spawnSync(command, args, { stdio: 'inherit' }).status

const getFiles = () =>
  execFileSync('git', ['diff-index', '--diff-filter=AM', '--ignore-submodules', '--name-only', 'master'], {
    encoding: 'utf8',
  })
    .split('\n')
    .filter(_ => _ !== '')

// -----------------------------------------------------------------------------

// Travis vars : https://docs.travis-ci.com/user/environment-variables#default-environment-variables.
if (process.env.TRAVIS_PULL_REQUEST !== 'false') {
  const files = getFiles().filter(_ => _.endsWith('.cjs') || _.endsWith('.js') || _.endsWith('.mjs'))
  if (files.length !== 0) {
    process.exit(run('./node_modules/.bin/jest', ['--findRelatedTests', '--passWithNoTests'].concat(files)))
  }
} else {
  process.exit(run('yarn', ['test-lint']) + run('yarn', ['test-unit']) + run('yarn', ['test-integration']))
}
