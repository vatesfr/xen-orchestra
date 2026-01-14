'use strict'

const { asCallback, fromCallback, fromEvent } = require('promise-toolbox')
const { getHandler } = require('@xen-orchestra/fs')
const { relative } = require('path')
const { start: createRepl } = require('repl')
const vhdLib = require('vhd-lib')

module.exports = async function repl(args) {
  if (args.some(_ => _ === '-h' || _ === '--help')) {
    return `Starts REPL on given remote, or on remote at current path if no param is passed. (works only for unencrypted remotes)
    Usage: ${this.command} <remote URL (optional)>`
  }
  const unexpectedArgs = args.filter(arg => arg.startsWith('-'))
  if (unexpectedArgs.length > 0) {
    return `Option${unexpectedArgs.length > 1 ? 's' : ''} ${unexpectedArgs} unsupported, use --help for details.`
  }
  const cwd = process.cwd()
  const url = args.length === 0 ? 'file://' + cwd : args[0]
  const handler = getHandler({ url })
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
