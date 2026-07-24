#!/usr/bin/env node

'use strict'

const { env } = process
if (env.DEBUG === undefined) {
  env.DEBUG = '*'
}

const { load, watch } = require('./index.js')
const { inspect } = require('util')

const { stdout } = process

let useJson = !stdout.isTTY

function print(paths, config) {
  if (paths.length !== 0) {
    config =
      paths.length === 1
        ? paths[0].split('.').reduce((o, k) => o?.[k], config)
        : Object.fromEntries(paths.filter(k => k in config).map(k => [k, config[k]]))
  }

  stdout.write(
    useJson
      ? JSON.stringify(config, null, 2)
      : inspect(config, {
          colors: true,
          depth: Infinity,
          sorted: true,
        })
  )
  stdout.write('\n')
}

async function main(args) {
  const cliOpts = {
    _: [],
    envPrefix: undefined,
    help: false,
    paths: [],
    watch: false,
  }
  for (let i = 0, n = args.length; i < n;) {
    const arg = args[i++]
    if (arg[0] === '-') {
      if (arg === '-h' || arg === '--help') {
        cliOpts.help = true
      } else if (arg === '-j' || arg === '--json') {
        useJson = true
      } else if (arg === '-w' || arg === '--watch') {
        cliOpts.watch = true
      } else if (arg === '--no-env') {
        cliOpts.envPrefix = false
      } else if (arg === '--env-prefix') {
        if (i < n) {
          cliOpts.envPrefix = args[i++]
        } else {
          throw new Error('missing argument for --env-prefix option')
        }
      } else if (arg === '-p' || arg === '--path') {
        if (i < n) {
          cliOpts.paths.push(args[i++])
        } else {
          throw new Error('missing argument for --path option')
        }
      } else {
        throw new Error('unknown option: ' + arg)
      }
    } else {
      cliOpts._.push(arg)
    }
  }

  if (cliOpts._.length === 0 || cliOpts.help) {
    const { name, version } = require('./package.json')
    return stdout.write(`Usage: ${name} [--json | -j] [--watch | -w] [--env-prefix <prefix> | --no-env] [-p <path>]... <appName> [<appDir>]

${name} v${version}
`)
  }

  const [appName, appDir] = cliOpts._

  const opts = {
    appDir,
    appName,
    envPrefix: cliOpts.envPrefix,
    ignoreUnknownFormats: true,
    initialLoad: true,
  }
  const printPaths = print.bind(undefined, cliOpts.paths)

  if (cliOpts.watch) {
    await watch(opts, (error, config) => {
      console.log('--', new Date())
      if (error !== undefined) {
        console.warn(error)
        return
      }
      printPaths(config)
    })
  } else {
    printPaths(await load(appName, opts))
  }
}
main(process.argv.slice(2)).catch(console.error.bind(console, 'FATAL:'))
