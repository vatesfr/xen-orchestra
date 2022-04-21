#!/usr/bin/env node

'use strict'

const formatFiles = files => {
  run('./node_modules/.bin/prettier', ['--write'].concat(files))
}
const testFiles = files => {
  run('./node_modules/.bin/eslint', ['--ignore-pattern', '!*'].concat(files))
  run(
    './node_modules/.bin/jest',
    ['--testRegex=^(?!.*.integ.spec.js$).*.spec.js$', '--findRelatedTests', '--passWithNoTests'].concat(files)
  )
}

// -----------------------------------------------------------------------------

const { execFileSync, spawnSync } = require('child_process')
const { readFileSync, writeFileSync } = require('fs')

const run = (command, args) => {
  const { status } = spawnSync(command, args, { stdio: 'inherit' })
  if (status !== 0) {
    process.exit(status)
  }
}

const gitDiff = (what, args = []) =>
  execFileSync('git', ['diff-' + what, '--diff-filter=AM', '--ignore-submodules', '--name-only'].concat(args), {
    encoding: 'utf8',
  })
    .split('\n')
    .filter(_ => _ !== '')
const gitDiffFiles = (files = []) => gitDiff('files', files)
const gitDiffIndex = () => gitDiff('index', ['--cached', 'HEAD'])

// -----------------------------------------------------------------------------

const files = gitDiffIndex().filter(_ => _.endsWith('.cjs') || _.endsWith('.js') || _.endsWith('.mjs'))
if (files.length === 0) {
  return
}

// save the list of files with unstaged changes
let unstaged = gitDiffFiles(files)

// format all files
formatFiles(files)

if (unstaged.length !== 0) {
  // refresh the list of files with unstaged changes, maybe the
  // changes have been reverted by the formatting
  run('git', ['update-index', '-q', '--refresh'])
  unstaged = gitDiffFiles(unstaged)

  if (unstaged.length !== 0) {
    const contents = unstaged.map(name => readFileSync(name))
    process.on('exit', () => unstaged.map((name, i) => writeFileSync(name, contents[i])))
    run('git', ['checkout'].concat(unstaged))
    formatFiles(unstaged)
  }
}

// add formatting changes so that even if the test fails, there won't be
// stylistic diffs between files and index
run('git', ['add'].concat(files))

testFiles(files)
