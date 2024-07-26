/* eslint-disable no-console */
import blocked from 'blocked'
import filter from 'lodash/filter.js'
import find from 'lodash/find.js'
import L from 'lodash'
import minimist from 'minimist'
import pw from 'pw'
import transportConsole from '@xen-orchestra/log/transports/console'
import { asCallback, fromCallback, fromEvent } from 'promise-toolbox'
import { createLogger } from '@xen-orchestra/log'
import { configure } from '@xen-orchestra/log/configure'
import { diff } from 'jest-diff'
import { getBoundPropertyDescriptor } from 'bind-property-descriptor'
import { start as createRepl } from 'repl'

// ===================================================================

function askPassword(prompt = 'Password: ') {
  if (prompt) {
    process.stdout.write(prompt)
  }

  return new Promise(resolve => {
    pw(resolve)
  })
}

const { getPrototypeOf, ownKeys } = Reflect
function getAllBoundDescriptors(object) {
  const descriptors = { __proto__: null }
  let current = object
  do {
    ownKeys(current).forEach(key => {
      if (!(key in descriptors)) {
        descriptors[key] = getBoundPropertyDescriptor(current, key, object)
      }
    })
  } while ((current = getPrototypeOf(current)) !== null)
  return descriptors
}

// ===================================================================

const usage = 'Usage: xen-api <url> [<user> [<password>]]'

export async function main(createClient) {
  const opts = minimist(process.argv.slice(2), {
    string: ['proxy', 'session-id', 'transport'],
    boolean: ['allow-unauthorized', 'help', 'read-only', 'verbose'],

    alias: {
      'allow-unauthorized': 'au',
      debounce: 'd',
      help: 'h',
      proxy: 'p',
      'read-only': 'ro',
      verbose: 'v',
      transport: 't',
    },
  })

  if (opts.help) {
    return usage
  }

  if (opts.verbose) {
    const { env } = process
    configure({
      // display warnings or above, and all that are enabled via DEBUG or
      // NODE_DEBUG env
      filter: [env.DEBUG, env.NODE_DEBUG, 'xen-api,xen-api:*'].filter(Boolean).join(','),
      level: 'info',

      transport: transportConsole(),
    })
  }

  let auth
  if (opts._.length > 1) {
    const [, user, password = await askPassword()] = opts._
    auth = { user, password }
  } else if (opts['session-id'] !== undefined) {
    auth = { sessionId: opts['session-id'] }
  }

  {
    const { debug } = createLogger('xen-api:perf')
    blocked(ms => {
      debug(`blocked for ${ms | 0}ms`)
    })
  }

  const xapi = createClient({
    url: opts._[0],
    allowUnauthorized: opts.au,
    auth,
    debounce: opts.debounce != null ? +opts.debounce : null,
    httpProxy: opts.proxy,
    readOnly: opts.ro,
    syncStackTraces: true,
    transport: opts.transport || undefined,
  })
  await xapi.connect()

  const repl = createRepl({
    prompt: `${xapi._humanId}> `,
  })

  {
    const ctx = repl.context
    ctx.xapi = xapi

    ctx.diff = (a, b) => console.log('%s', diff(a, b))
    ctx.find = predicate => find(xapi.objects.all, predicate)
    ctx.findAll = predicate => filter(xapi.objects.all, predicate)
    ctx.L = L

    Object.defineProperties(ctx, getAllBoundDescriptors(xapi))
  }

  // Make the REPL waits for promise completion.
  repl.eval = (evaluate => (cmd, context, filename, cb) => {
    asCallback.call(
      fromCallback(cb => {
        evaluate.call(repl, cmd, context, filename, cb)
      }).then(value => (Array.isArray(value) ? Promise.all(value) : value)),
      cb
    )
  })(repl.eval)

  await fromEvent(repl, 'exit')

  try {
    await xapi.disconnect()
  } catch (error) {}
}
/* eslint-enable no-console */
