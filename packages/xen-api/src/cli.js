import Bluebird, {coroutine} from 'bluebird'
import eventToPromise from 'event-to-promise'
import execPromise from 'exec-promise'
import minimist from 'minimist'
import pw from 'pw'
import {start as createRepl} from 'repl'

import {createClient} from './'

const usage = `Usage: xen-api <url> <user>`

const main = coroutine(function * (args) {
  const opts = minimist(args, {
    boolean: ['help'],

    alias: {
      help: 'h'
    }
  })

  if (opts.help) {
    return usage
  }

  const [url, user] = opts._
  if (!url || !user) {
    throw new Error('missing arguments')
  }

  process.stdout.write('Password: ')
  const password = yield new Bluebird(resolve => {
    pw(resolve)
  })

  const xapi = createClient({url, auth: {user, password}})
  yield xapi.connect()

  const repl = createRepl({
    prompt: `${xapi._humanId}> `
  })
  repl.context.xapi = xapi
  yield eventToPromise(repl, 'exit')

  try {
    yield xapi.disconnect()
  } catch (error) {}
})
export default main

if (!module.parent) {
  execPromise(main)
}
