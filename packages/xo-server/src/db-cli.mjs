#!/usr/bin/env node

import { createClient as createRedisClient } from 'redis'
import { start as startRepl } from 'repl'
import appConf from 'app-conf'

import RedisCollection from './collection/redis.mjs'

function assert(test, message) {
  if (!test) {
    console.error(message)
    process.exit(1)
  }
}

async function getDb(namespace) {
  const { connection } = this
  return new RedisCollection({
    connection,
    indexes: await connection.sMembers(`xo:${namespace}::indexes`),
    namespace,
  })
}

function getNamespaces() {
  return this.connection.sMembers('xo::namespaces')
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
    context.redis = this.connection
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

  const config = await appConf.load('xo-server', {
    appDir: new URL('..', import.meta.url).pathname,
    ignoreUnknownFormats: true,
  })

  const { socket: path, uri: url } = config.redis || {}
  const connection = createRedisClient({
    socket: { path },
    url,
  })
  await connection.connect()
  // await repl({ context: { redis: connection } })
  try {
    const fn = COMMANDS[args.shift()]
    assert(fn !== undefined, 'command must be one of: ' + Object.keys(COMMANDS).join(', '))

    await fn.call({ connection, getDb, getNamespaces }, args)
  } finally {
    await connection.quit()
  }
}
main(process.argv.slice(2)).catch(console.error)
