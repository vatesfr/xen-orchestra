#!/usr/bin/env node

import 'babel-polyfill'

import blocked from 'blocked'
import createDebug from 'debug'
import eventToPromise from 'event-to-promise'
import execPromise from 'exec-promise'
import minimist from 'minimist'
import pw from 'pw'
import { asCallback, fromCallback } from 'promise-toolbox'
import { filter, find } from 'lodash'
import { start as createRepl } from 'repl'

import { createClient } from './'

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

const usage = 'Usage: xen-api <url> <user> [<password>]'

const main = async args => {
  const opts = minimist(args, {
    boolean: ['help', 'read-only', 'verbose'],

    alias: {
      debounce: 'd',
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
    password = await askPassword()
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
    debounce: opts.debounce != null ? +opts.debounce : null,
    readOnly: opts.ro
  })
  await xapi.connect()

  const repl = createRepl({
    prompt: `${xapi._humanId}> `
  })
  repl.context.xapi = xapi

  repl.context.find = predicate => find(xapi.objects.all, predicate)
  repl.context.findAll = predicate => filter(xapi.objects.all, predicate)

  // Make the REPL waits for promise completion.
  repl.eval = (evaluate => (cmd, context, filename, cb) => {
    fromCallback(cb => {
      evaluate.call(repl, cmd, context, filename, cb)
    })::asCallback(cb)
  })(repl.eval)

  await eventToPromise(repl, 'exit')

  try {
    await xapi.disconnect()
  } catch (error) {}
}
export default main

if (!module.parent) {
  execPromise(main)
}
