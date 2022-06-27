'use strict'

const { asCallback, fromCallback, fromEvent } = require('promise-toolbox')
const { getHandler } = require('@xen-orchestra/fs')
const { relative } = require('path')
const { start: createRepl } = require('repl')
const vhdLib = require('vhd-lib')

module.exports = async function repl(args) {
  const cwd = process.cwd()
  const handler = getHandler({ url: 'file://' + cwd })
  await handler.sync()
  try {
    const repl = createRepl({
      prompt: 'vhd> ',
    })
    Object.assign(repl.context, vhdLib)
    repl.context.handler = handler
    repl.context.open = path => new vhdLib.VhdFile(handler, relative(cwd, path))

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
  } finally {
    await handler.forget()
  }
}
