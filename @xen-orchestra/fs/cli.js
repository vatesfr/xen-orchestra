#!/usr/bin/env node

'use strict'

const Disposable = require('promise-toolbox/Disposable')
const { getBoundPropertyDescriptor } = require('bind-property-descriptor')

const { getSyncedHandler } = require('./')

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

// https://gist.github.com/julien-f/18161f6032e808d6fa08782951ce3bfb
async function repl({ prompt, context } = {}) {
  const repl = require('repl').start({
    ignoreUndefined: true,
    prompt,
  })
  if (context !== undefined) {
    Object.defineProperties(repl.context, Object.getOwnPropertyDescriptors(context))
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
  return new Promise((resolve, reject) => {
    repl.on('error', reject).on('exit', resolve)
  })
}

async function* main([url, ...args]) {
  if (url === undefined) {
    throw new TypeError('missing arg <url>')
  }

  const handler = yield getSyncedHandler({ url })

  const methods = Object.create(null, getAllBoundDescriptors(handler))

  if (args.length === 0) {
    await repl({
      prompt: handler.type + '> ',
      context: methods,
    })
  } else {
    const method = args.shift()
    const fn = methods[method]
    if (fn === undefined) {
      const message = 'unknown method: ' + method
      throw message
    }

    const result = await fn(...args)
    if (result !== undefined) {
      console.log(result)
    }
  }
}

Disposable.wrap(main)(process.argv.slice(2)).catch(error => {
  console.error('FATAL:', error)
  process.exitCode = 1
})
