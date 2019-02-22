const { checkVhdChain, default: Vhd } = require('vhd-lib')
const { getHandler } = require('@xen-orchestra/fs')
const { resolve } = require('fs').posix
const { strictEqual: assertEq } = require('assert')
const getopts = require('getopts')

// const seenFiles = new Set()
const extraFiles = { __proto__: null }

function assertPropTypes(object, propTypes) {
  assertEq(typeof object, 'object')
  Object.keys(propTypes).forEach(prop => {
    assertEq(typeof object[prop], propTypes[prop])
  })
}

async function checkVmBackup(handler, path) {
  const metadata = await handler.readFile(path).then(JSON.parse)
  assertPropTypes(metadata, {
    jobId: 'string',
    mode: 'string',
    scheduleId: 'string',
    timestamp: 'number',
    vbds: 'object',
    vdis: 'object',
    version: 'string',
    vhds: 'object',
    vifs: 'object',
    vm: 'object',
    vmSnapshot: 'object',
  })
}

async function checkVmBackups(handler, path) {
  const entries = await handler.list(path, {
    prependDir: true,
  })
  await Promise.all(
    entries.map(_ => {
      return checkVmBackup(handler, _)
    })
  )
}

const required = name => {
  throw new Error(`<${name}> param is required`)
}

async function main(rawArgs) {
  const [backupFile = required('backupFile')] = getopts(rawArgs)

  const handler = getHandler({ url: 'file:///' })

  return checkVmBackup(handler, resolve(backupFile))
}
main(process.argv.slice(2)).catch(console.error)
