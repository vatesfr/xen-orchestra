#!/usr/bin/env node

'use strict'

const { delimiter } = require('path')
const { forEach, fromEvent } = require('promise-toolbox')
const { spawn } = require('child_process')
const getopts = require('getopts')

const { getPackages } = require('./utils')

const { env } = process

async function run(command, opts, verbose) {
  const child = spawn(command, {
    ...opts,
    shell: true,
    stdio: verbose ? 'inherit' : 'pipe',
  })

  const output = []
  if (!verbose) {
    function onData(chunk) {
      output.push(chunk)
    }
    child.stderr.on('data', onData)
    child.stdout.on('data', onData)
  }

  const code = await fromEvent(child, 'exit')
  if (code !== 0) {
    for (const chunk of output) {
      process.stderr.write(chunk)
    }

    throw code
  }
}

// run a script for each package (also run pre and post)
//
// TODO: https://docs.npmjs.com/misc/scripts#environment
require('exec-promise')(args => {
  const {
    bail,
    concurrency,
    parallel,
    verbose,
    _: [script],
  } = getopts(args, {
    boolean: ['bail', 'parallel', 'verbose'],
    string: ['concurrency'],
  })

  let errors = 0
  return getPackages(true)
    [parallel ? 'map' : 'forEach'](
      ({ dir, name, package: { scripts } }) => {
        if (scripts == null) {
          return
        }

        const spawnOpts = {
          cwd: dir,
          env: Object.assign({}, env, {
            PATH: `${dir}/node_modules/.bin${delimiter}${env.PATH}`,
          }),
        }
        return forEach.call([`pre${script}`, script, `post${script}`], script => {
          const command = scripts[script]
          if (command !== undefined) {
            console.log(`* ${name}:${script} −`, command)
            return run(command, spawnOpts, verbose).catch(code => {
              if (code !== 0) {
                if (bail) {
                  // eslint-disable-next-line no-throw-literal
                  throw `${name}:${script} − Error: ` + code
                }

                ++errors
                console.log(`* ${name}:${script} − Error:`, code)
              }
            })
          }
        })
      },
      { concurrency: concurrency ? Number(concurrency) : undefined }
    )
    .then(() => {
      if (errors !== 0) {
        throw errors
      }
    })
})
