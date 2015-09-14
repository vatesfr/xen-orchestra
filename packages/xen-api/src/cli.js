#!/usr/bin/env node

import blocked from 'blocked'
import Bluebird, {coroutine} from 'bluebird'
import eventToPromise from 'event-to-promise'
import execPromise from 'exec-promise'
import minimist from 'minimist'
import pw from 'pw'
import {start as createRepl} from 'repl'

import {createClient} from './'

// ===================================================================

// Imports utils for better stacktraces.
import '../.mocha'

import createDebug from 'debug'

// ===================================================================

function askPassword (prompt = 'Password: ') {
  if (prompt) {
    process.stdout.write(prompt)
  }

  return new Promise(resolve => {
    pw(resolve)
  })
}

function required (name) {
  throw new Error(`missing required argument ${name}`)
}

// ===================================================================

const usage = `Usage: xen-api <url> <user> [<password>]`

const main = coroutine(function * (args) {
  const opts = minimist(args, {
    boolean: ['help', 'read-only', 'verbose'],

    alias: {
      help: 'h',
      'read-only': 'ro',
      verbose: 'v'
    }
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

  const [
    url = required('url'),
    user = required('user'),
    password = yield askPassword()
  ] = opts._

  {
    const debug = createDebug('xen-api:perf')
    blocked(ms => {
      debug('blocked for %sms', ms | 0)
    })
  }

  const xapi = createClient({
    url,
    auth: { user, password },
    readOnly: opts.ro
  })
  yield xapi.connect()

  const repl = createRepl({
    prompt: `${xapi._humanId}> `
  })
  repl.context.xapi = xapi

  // Make the REPL waits for promise completion.
  {
    const evaluate = Bluebird.promisify(repl.eval)
    repl.eval = (cmd, context, filename, cb) => {
      evaluate(cmd, context, filename)
        // See https://github.com/petkaantonov/bluebird/issues/594
        .then(result => result)
        .nodeify(cb)
    }
  }

  yield eventToPromise(repl, 'exit')

  try {
    yield xapi.disconnect()
  } catch (error) {}
})
export default main

if (!module.parent) {
  execPromise(main)
}
