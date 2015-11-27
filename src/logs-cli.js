import appConf from 'app-conf'
import get from 'lodash.get'
import highland from 'highland'
import levelup from 'level-party'
import ndjson from 'ndjson'
import parseArgs from 'minimist'
import sublevel from 'level-sublevel'
import util from 'util'
import { repair as repairDb } from 'leveldown'

import {forEach} from './utils'
import globMatcher from './glob-matcher'

// ===================================================================

async function printLogs (db, args) {
  let stream = highland(db.createReadStream({reverse: true}))

  if (args.since) {
    stream = stream.filter(({value}) => (value.time >= args.since))
  }

  if (args.until) {
    stream = stream.filter(({value}) => (value.time <= args.until))
  }

  const fields = Object.keys(args.matchers)

  if (fields.length > 0) {
    stream = stream.filter(({value}) => {
      for (const field of fields) {
        const fieldValue = get(value, field)
        if (fieldValue === undefined || !args.matchers[field](fieldValue)) {
          return false
        }
      }

      return true
    })
  }

  stream = stream.take(args.limit)

  if (args.json) {
    stream = highland(stream.pipe(ndjson.serialize()))
      .each(value => {
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

function helper () {
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

      Patterns have the following format \`<field>=<value>\`/\`<field>\`.

xo-server-logs --repair

    Repair/compact the database.

    This is an advanced operation and should be used only when necessary and offline (xo-server should be stopped).
`)
}

// ===================================================================

function getArgs () {
  const stringArgs = ['since', 'until', 'limit']
  const args = parseArgs(process.argv.slice(2), {
    string: stringArgs,
    boolean: ['help', 'json', 'repair'],
    default: {
      limit: 100,
      json: false,
      help: false
    },
    alias: {
      limit: 'n',
      help: 'h'
    }
  })

  const patterns = {}

  for (let value of args._) {
    value = String(value)

    const i = value.indexOf('=')

    if (i !== -1) {
      const field = value.slice(0, i)
      const pattern = value.slice(i + 1)

      patterns[pattern]
        ? patterns[field].push(pattern)
        : patterns[field] = [ pattern ]
    } else if (!patterns[value]) {
      patterns[value] = null
    }
  }

  const trueFunction = () => true
  args.matchers = {}

  for (const field in patterns) {
    const values = patterns[field]
    args.matchers[field] = (values === null) ? trueFunction : globMatcher(values)
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

  if (isNaN(args.limit = +args.limit)) {
    throw new Error('error: limit is not a valid number')
  }

  return args
}

// ===================================================================

export default async function main () {
  const args = getArgs()

  if (args.help) {
    helper()
    return
  }

  const config = await appConf.load('xo-server', {
    ignoreUnknownFormats: true
  })

  if (args.repair) {
    await new Promise((resolve, reject) => {
      repairDb(`${config.datadir}/leveldb`, error => {
        if (error) {
          reject(error)
        } else {
          resolve()
        }
      })
    })

    return
  }

  const db = sublevel(levelup(
    `${config.datadir}/leveldb`,
    { valueEncoding: 'json' }
  )).sublevel('logs')

  return printLogs(db, args)
}
