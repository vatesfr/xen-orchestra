#!/usr/bin/env node

const { env, stdout } = process

const { load, watch } = require('./index.js')
const { inspect } = require('util')

if (env.DEBUG === undefined) {
  env.DEBUG = '*'
}

let useJson = !stdout.isTTY

type Config = Record<string, unknown>

function print(paths: string[], config: unknown): void {
  let result: unknown = config

  if (paths.length !== 0) {
    result =
      paths.length === 1
        ? paths[0].split('.').reduce<unknown>((o, k) => (o as Config | undefined)?.[k], config)
        : Object.fromEntries(
            paths
              .filter(k => config !== null && typeof config === 'object' && k in (config as Config))
              .map(k => [k, (config as Config)[k]])
          )
  }

  stdout.write(
    useJson
      ? JSON.stringify(result, null, 2)
      : inspect(result, {
          colors: true,
          depth: Infinity,
          sorted: true,
        })
  )
  stdout.write('\n')
}

interface CliOptions {
  _: string[]
  envPrefix: string | false | undefined
  help: boolean
  paths: string[]
  watch: boolean
}

async function main(args: string[]): Promise<void> {
  const cliOpts: CliOptions = {
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
    const { name, version } = require('../package.json')
    stdout.write(`Usage: ${name} [--json | -j] [--watch | -w] [--env-prefix <prefix> | --no-env] [-p <path>]... <appName> [<appDir>]

${name} v${version}
`)
    return
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
    await watch(opts, (error?: unknown, config?: unknown) => {
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
