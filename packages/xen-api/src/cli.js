#!/usr/bin/env node

import blocked from 'blocked'
import createDebug from 'debug'
import diff from 'jest-diff'
import minimist from 'minimist'
import pw from 'pw'
import { asCallback, fromCallback, fromEvent } from 'promise-toolbox'
import { filter, find } from 'lodash'
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

async function main(createClient) {
  const opts = minimist(process.argv.slice(2), {
    string: ['session-id'],
    boolean: ['allow-unauthorized', 'help', 'read-only', 'verbose'],

    alias: {
      'allow-unauthorized': 'au',
      debounce: 'd',
      help: 'h',
      'read-only': 'ro',
      verbose: 'v',
    },
  })

  if (opts.help) {
    return usage
  }

  if (opts.verbose) {
    // Does not work perfectly.
    //
    // https://github.com/visionmedia/debug/pull/156
    createDebug.enable('xen-api,xen-api:*')
  }

  let auth
  if (opts._.length > 1) {
    const [, user, password = await askPassword()] = opts._
    auth = { user, password }
  } else if (opts['session-id'] !== undefined) {
    auth = { sessionId: opts['session-id'] }
  }

  {
    const debug = createDebug('xen-api:perf')
    blocked(ms => {
      debug('blocked for %sms', ms | 0)
    })
  }

  const xapi = createClient({
    url: opts._[0],
    allowUnauthorized: opts.au,
    auth,
    debounce: opts.debounce != null ? +opts.debounce : null,
    readOnly: opts.ro,
    syncStackTraces: true,
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
export default main

if (!module.parent) {
  main(require('./').createClient).catch(console.error.bind(console, 'FATAL'))
}
