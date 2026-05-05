#!/usr/bin/env node

import { start as startRepl } from 'repl'
import { Worker } from 'worker_threads'
import appConf from 'app-conf'

import RedisCollection from './collection/redis.mjs'

function startSpinner() {
  if (!process.stdout.isTTY) return () => {}

  const worker = new Worker(
    `const { parentPort } = require('worker_threads')
    const { writeSync } = require('fs')
    const frames = [' | ', ' / ', ' - ', ' \\\\ ']
    let i = 0
    writeSync(1, frames[0])
    const id = setInterval(() => writeSync(1, '\\r' + frames[i++ % frames.length]), 100)
    parentPort.once('message', () => { clearInterval(id); writeSync(1, '\\r\\x1b[K') })`,
    { eval: true }
  )
  worker.on('error', () => {})

  return () => worker.postMessage('stop')
}

function assert(test, message) {
  if (!test) {
    console.error(message)
    process.exit(1)
  }
}

async function getDb(namespace) {
  return new RedisCollection({
    connection: this.xo._redis,
    indexes: await this.xo._redis.sMembers(`xo:${namespace}::indexes`),
    namespace,
    crypto: this.xo.cryptoCredentials,
  })
}

function getNamespaces() {
  return this.xo._redis.sMembers('xo::namespaces')
}

function parseParam(args) {
  const params = {}
  for (const arg of args) {
    const i = arg.indexOf('=')
    if (i === -1) {
      throw new Error('invalid arg: ' + arg)
    }

    const name = arg.slice(0, i)
    let value = arg.slice(i + 1)
    if (value.startsWith('json:')) {
      value = JSON.parse(value.slice(5))
    }
    params[name] = value
  }
  return params
}

function sortKeys(object) {
  const result = {}
  const keys = Object.keys(object).sort()
  for (const key of keys) {
    result[key] = object[key]
  }
  return result
}

const COMMANDS = {
  async ls(args) {
    if (args.length === 0) {
      const namespaces = await this.getNamespaces()
      namespaces.sort()
      for (const ns of namespaces) {
        console.log(ns)
      }
    } else {
      const db = await this.getDb(args.shift())
      const records = await db.get(parseParam(args))
      process.stdout.write(`${records.length} record(s) found\n`)
      for (const record of records) {
        console.log(sortKeys(record))
      }
    }
  },

  async repl() {
    const repl = startRepl({
      ignoreUndefined: true,
      prompt: '> ',
    })
    const { context } = repl
    context.redis = this.xo._redis
    for (const namespace of await this.getNamespaces()) {
      context[namespace] = await this.getDb(namespace)
    }
    const { eval: evaluate } = repl
    repl.eval = (cmd, context, filename, cb) => {
      evaluate.call(repl, cmd, context, filename, (error, result) => {
        if (error != null) {
          return cb(error)
        }
        Promise.resolve(result).then(result => cb(undefined, result), cb)
      })
    }
    await new Promise((resolve, reject) => {
      repl.on('error', reject).on('exit', resolve)
    })
  },
}

async function main(args) {
  if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
    process.stdout.write(`
xo-server-db --help, -h

    Display this help message.

xo-server-db ls

    List the available namespaces.

xo-server-db ls <namespace> [<pattern>...]

    List all entries in the given namespace.

    <pattern>
      Patterns can be used to filter entries.

      Patterns have the following format \`<field>=<value>\`.

xo-server-logs repl

    Open a REPL to interact directly with the database.

    Available objects:
      - redis: a raw node-redis instance connected to the database
      - <namespace>: an xo-collection instance to the corresponding namespace in the database

`)
    return
  }

  const stopSpinner = startSpinner()

  // Import xo.mjs now so we display the loader.
  const [{ default: Xo }, config] = await Promise.all([
    import('./xo.mjs'),
    appConf.load('xo-server', {
      appDir: new URL('..', import.meta.url).pathname,
      ignoreUnknownFormats: true,
    }),
  ])

  const xo = new Xo({ config })
  await xo.hooks.startCore()
  stopSpinner()

  try {
    const fn = COMMANDS[args.shift()]
    assert(fn !== undefined, 'command must be one of: ' + Object.keys(COMMANDS).join(', '))

    await fn.call({ xo, getDb, getNamespaces }, args)
  } finally {
    await xo.hooks.stop()
  }
}
main(process.argv.slice(2)).then(
  () => process.exit(0),
  error => {
    console.error(error)
    process.exit(1)
  }
)
