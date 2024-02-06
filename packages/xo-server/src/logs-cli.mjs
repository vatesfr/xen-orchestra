#!/usr/bin/env node

import appConf from 'app-conf'
import execPromise from 'exec-promise'
import get from 'lodash/get.js'
import highland from 'highland'
import levelup from 'level-party'
import ndjson from 'ndjson'
import parseArgs from 'minimist'
import sublevel from 'subleveldown'
import util from 'util'

import { forEach } from './utils.mjs'
import globMatcher from './glob-matcher.mjs'

// ===================================================================

const getLogs = (db, args) => {
  let stream = highland(db.createReadStream({ reverse: true }))

  if (args.since) {
    stream = stream.filter(({ value }) => value.time >= args.since)
  }

  if (args.until) {
    stream = stream.filter(({ value }) => value.time <= args.until)
  }

  const fields = Object.keys(args.matchers)

  if (fields.length > 0) {
    stream = stream.filter(({ value }) => {
      for (const field of fields) {
        const fieldValue = get(value, field)
        if (!args.matchers[field](fieldValue)) {
          return false
        }
      }

      return true
    })
  }

  return stream.take(args.limit)
}

// ===================================================================

const deleteLogs = (db, args) =>
  new Promise(resolve => {
    let nDeleted = 0
    let nRunning = 1
    const cb = () => {
      if (--nRunning === 0) {
        console.log(nDeleted.toLocaleString(), 'deleted entries')
        resolve()
      }
    }

    const deleteEntry = key => {
      ++nDeleted
      ++nRunning
      db.del(key, cb)
    }

    getLogs(db, args)
      .each(({ key }) => {
        deleteEntry(key)
      })
      .done(cb)
  })

const GC_KEEP = 2e4

const gc = (db, args) =>
  new Promise((resolve, reject) => {
    let keep = GC_KEEP

    let count = 1
    const cb = () => {
      if (--count === 0) {
        resolve()
      }
    }
    const stream = db.createKeyStream({
      reverse: true,
    })

    const deleteEntry = key => {
      ++count
      db.del(key, cb)
    }

    let onData =
      keep !== 0
        ? () => {
            if (--keep === 0) {
              stream.removeListener('data', onData)
              onData = deleteEntry
              stream.on('data', onData)
            }
          }
        : deleteEntry
    const onEnd = () => {
      console.log('end')
      removeListeners()
      cb()
    }
    const onError = error => {
      console.log('error')
      removeListeners()
      reject(error)
    }
    const removeListeners = () => {
      stream.removeListener('data', onData).removeListener('end', onEnd).removeListener('error', onError)
    }
    stream.on('data', onData).on('end', onEnd).on('error', onError)
  })

async function printLogs(db, args) {
  let stream = getLogs(db, args)

  if (args.json) {
    stream = highland(stream.pipe(ndjson.stringify())).each(value => {
      process.stdout.write(value)
    })
  } else {
    stream = stream.each(value => {
      console.log(util.inspect(value, { depth: null }))
    })
  }

  return new Promise(resolve => {
    stream.done(resolve)
  })
}

// ===================================================================

function helper() {
  console.error(`
xo-server-logs --help, -h

    Display this help message.

xo-server-logs [--json] [--limit=<limit>] [--since=<date>] [--until=<date>] [<pattern>...]

    Prints the logs.

    --json
      Display the results as new line delimited JSON for consumption
      by another program.

    --limit=<limit>, -n <limit>
      Limit the number of results to be displayed (default 100)

    --since=<date>, --until=<date>
      Start showing entries on or newer than the specified date, or on
      or older than the specified date.

      <date> should use the format \`YYYY-MM-DD\`.

    <pattern>
      Patterns can be used to filter the entries.

      Patterns have the following format \`<field>=<value>\`, \`<field>\` or \`!<field>\`.

xo-server-logs --gc

    Remove all but the ${GC_KEEP}th most recent log entries.

xo-server-logs --delete <predicate>...

    Delete all logs matching the passed predicates.

    For more information on predicates, see the print usage.

xo-server-logs --repair

    Repair/compact the database.

    This is an advanced operation and should be used only when necessary and offline (xo-server should be stopped).
`)
}

// ===================================================================

function getArgs() {
  const stringArgs = ['since', 'until', 'limit']
  const args = parseArgs(process.argv.slice(2), {
    string: stringArgs,
    boolean: ['delete', 'help', 'json', 'gc', 'repair'],
    default: {
      limit: 100,
      json: false,
      help: false,
    },
    alias: {
      limit: 'n',
      help: 'h',
    },
  })

  const patterns = {}

  for (let value of args._) {
    value = String(value)

    const i = value.indexOf('=')

    if (i !== -1) {
      const field = value.slice(0, i)
      const pattern = value.slice(i + 1)

      const fieldPatterns = patterns[field]
      if (fieldPatterns === undefined) {
        patterns[field] = [pattern]
      } else if (Array.isArray(fieldPatterns)) {
        fieldPatterns.push(pattern)
      } else {
        throw new Error('cannot mix existence with equality patterns')
      }
    } else {
      const negate = value[0] === '!'
      if (negate) {
        value = value.slice(1)
      }

      if (patterns[value]) {
        throw new Error('cannot mix existence with equality patterns')
      }

      patterns[value] = !negate
    }
  }

  const mustExists = value => value !== undefined
  const mustNotExists = value => value === undefined

  args.matchers = {}

  for (const field in patterns) {
    const values = patterns[field]
    args.matchers[field] = values === true ? mustExists : values === false ? mustNotExists : globMatcher(values)
  }

  // Warning: minimist makes one array of values if the same option is used many times.
  // (But only for strings args, not boolean)
  forEach(stringArgs, arg => {
    if (args[arg] instanceof Array) {
      throw new Error(`error: too many values for ${arg} argument`)
    }
  })
  ;['since', 'until'].forEach(arg => {
    if (args[arg] !== undefined) {
      args[arg] = Date.parse(args[arg])

      if (isNaN(args[arg])) {
        throw new Error(`error: bad ${arg} timestamp format`)
      }
    }
  })

  if (isNaN((args.limit = +args.limit))) {
    throw new Error('error: limit is not a valid number')
  }

  return args
}

// ===================================================================

execPromise(async function main() {
  const args = getArgs()

  if (args.help) {
    helper()
    return
  }

  const config = await appConf.load('xo-server', {
    appDir: new URL('..', import.meta.url).pathname,
    ignoreUnknownFormats: true,
  })

  if (args.repair) {
    // TODO: remove once `import.meta.resolve` is stabilized
    const require = (await import('module')).createRequire(import.meta.url)

    // eslint-disable-next-line n/no-extraneous-require
    const { repair } = require(
      require.resolve('level', {
        paths: [require.resolve('level-party')],
      })
    )
    await new Promise((resolve, reject) => {
      repair(`${config.datadir}/leveldb`, error => {
        if (error) {
          reject(error)
        } else {
          resolve()
        }
      })
    })

    return
  }

  const db = sublevel(levelup(`${config.datadir}/leveldb`, { valueEncoding: 'json' }), 'logs', {
    valueEncoding: 'json',
  })

  return args.delete ? deleteLogs(db, args) : args.gc ? gc(db) : printLogs(db, args)
})
