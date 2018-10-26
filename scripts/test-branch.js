const { execFileSync, spawnSync } = require('child_process')

console.log(process.env)

const run = (command, args) => {
  const { status } = spawnSync(command, args, { stdio: 'inherit' })
  if (status !== 0) {
    process.exit(status)
  }
}

const getFiles = () =>
  execFileSync(
    'git',
    [
      'diff',
      '--diff-filter=AM',
      '--ignore-submodules',
      '--name-only',
      'master',
    ],
    { encoding: 'utf8' }
  )
    .split('\n')
    .filter(_ => _ !== '')

// -----------------------------------------------------------------------------

// Test branch
if (process.env.TRAVIS_PULL_REQUEST) {
  const files = getFiles().filter(_ => _.endsWith('.js'))
  if (files.length === 0) {
    return
  }

  run(
    './node_modules/.bin/jest',
    [
      '--testRegex=^(?!.*.integ.spec.js$).*.spec.js$',
      '--findRelatedTests',
      '--passWithNoTests',
    ].concat(files)
  )
}

if (
  !process.env.TRAVIS_PULL_REQUEST &&
  process.env.TRAVIS_BRANCH === 'master'
) {
  run('yarn', ['test'])
  run('yarn', ['test-integration'])
}

// const getSha1 = () =>
//   execFileSync(
//     'git',
//     [
//       'merge-base',
//       'origin/master',
//       'HEAD',
//     ],
//     { encoding: 'utf8' }
//   )

// const getFiles = (sha1) =>
//   execFileSync(
//     'git',
//     [
//       'diff',
//       '--name-only',
//       `${sha1}`,
//     ],
//     { encoding: 'utf8' }
//   )
//     .split('\n')
//     .filter(_ => _ !== '')

// const getFiles = () =>
//   execFileSync(
//     'git',
//     [
//       'diff-index',
//       '--diff-filter=AM',
//       '--ignore-submodules',
//       '--name-only',
//       '--cached',
//       `master`,
//     ],
//     { encoding: 'utf8' }
//   )
//     .split('\n')
//     .filter(_ => _ !== '')

// const currentBranch = () => execFileSync(
//   'git',
//   [
//     'symbolic-ref',
//     '--short',
//     'HEAD',
//   ],
//   { encoding: 'utf8' }
// )

// const sha1 = getSha1().replace(/\s+/g, '')
// const files = getFiles().filter(_ => _.endsWith('.js'))
// if (files.length === 0) {
//   return
// }
// const test = currentBranch()
// console.log("test-branch", "69", currentBranch())
// run(
//   'echo',
//   ['$test']
// )
// run(
//   './node_modules/.bin/jest',
//   [
//     '--testRegex=^(?!.*.integ.spec.js$).*.spec.js$',
//     '--findRelatedTests',
//     '--passWithNoTests',
//   ].concat(files)
//   )
