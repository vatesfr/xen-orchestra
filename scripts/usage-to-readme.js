#!/usr/bin/env node

'use strict'

const { compile } = require('handlebars')
const { dirname, join } = require('node:path')
const { readFile, writeFile } = require('node:fs/promises')
const { execFile } = require('node:child_process')

const generateReadme = readFile(join(__dirname, 'README.md.tpl'), 'utf8').then(compile)

async function usageToReadme(...args) {
  const gitAdd = args[0] === '--git-add'
  if (gitAdd) {
    args.shift()
  }

  for (const usagePath of args) {
    console.error(usagePath)
    const dir = dirname(usagePath)

    const [usage, pkg] = await Promise.all([
      readFile(usagePath, 'utf8'),
      readFile(join(dir, 'package.json')).then(JSON.parse),
    ])

    const readmePath = join(dir, 'README.md')
    await writeFile(readmePath, (await generateReadme)({ pkg, usage: usage.trim() }))

    if (gitAdd) {
      await new Promise((resolve, reject) => {
        execFile('git', ['add', '--', readmePath])
          .on('error', reject)
          .on('exit', code => {
            if (code !== 0) {
              reject(new Error('command exited with non-zero status code: ' + code))
            } else {
              resolve()
            }
          })
      })
    }
  }
}

if (module.parent !== null) {
  module.exports = usageToReadme
} else {
  usageToReadme(...process.argv.slice(2))
}
