'use strict'

const groupBy = require('lodash/groupBy')
const { asyncMap } = require('@xen-orchestra/async-map')
const { createHash } = require('crypto')
const { dirname, resolve } = require('path')

const { readdir2, readFile, getSize } = require('../_fs')

const sha512 = str => createHash('sha512').update(str).digest('hex')
const sum = values => values.reduce((a, b) => a + b)

module.exports = async function info(vmDirs) {
  const jsonFiles = (
    await asyncMap(vmDirs, async vmDir => (await readdir2(vmDir)).filter(_ => _.endsWith('.json')))
  ).flat()

  const hashes = { __proto__: null }

  const info = (
    await asyncMap(jsonFiles, async jsonFile => {
      try {
        const jsonDir = dirname(jsonFile)
        const json = await readFile(jsonFile)

        const hash = sha512(json)
        if (hash in hashes) {
          console.log(jsonFile, 'duplicate of', hashes[hash])
          return
        }
        hashes[hash] = jsonFile

        const metadata = JSON.parse(json)

        return {
          jsonDir,
          jsonFile,
          metadata,
          size:
            json.length +
            (await (metadata.mode === 'delta'
              ? asyncMap(Object.values(metadata.vhds), _ => getSize(resolve(jsonDir, _))).then(sum)
              : getSize(resolve(jsonDir, metadata.xva)))),
        }
      } catch (error) {
        console.error(jsonFile, error)
      }
    })
  ).filter(_ => _ !== undefined)
  const byJobs = groupBy(info, 'metadata.jobId')
  Object.keys(byJobs)
    .sort()
    .forEach(jobId => {
      console.log(jobId, sum(byJobs[jobId].map(_ => _.size)))
    })
}
