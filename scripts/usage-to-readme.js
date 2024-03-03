#!/usr/bin/env node

'use strict'

const { compile } = require('handlebars')
const { dirname, join } = require('node:path')
const { readFile, writeFile } = require('node:fs/promises')
const { execFile } = require('node:child_process')

const generateReadme = readFile(join(__dirname, 'README.md.tpl'), 'utf8').then(compile)

async function usageToReadme(usagePath, pkgDir, pkg, gitAdd = false) {
  const usage = await readFile(usagePath, 'utf8')

  const readmePath = join(pkgDir, 'README.md')
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
module.exports = usageToReadme

if (module.parent === null) {
  async function main(...args) {
    const gitAdd = args[0] === '--git-add'
    if (gitAdd) {
      args.shift()
    }

    for (const usagePath of args) {
      const dir = dirname(usagePath)

      await usageToReadme(usagePath, dir, await readFile(join(dir, 'package.json')).then(JSON.parse), gitAdd)
    }
  }
  main(...process.argv.slice(2))
}
