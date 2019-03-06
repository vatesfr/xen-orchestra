import { asCallback, fromCallback, fromEvent } from 'promise-toolbox'
import { getHandler } from '@xen-orchestra/fs'
import { relative } from 'path'
import { start as createRepl } from 'repl'
import Vhd, * as vhdLib from 'vhd-lib'

export default async args => {
  const cwd = process.cwd()
  const handler = getHandler({ url: 'file://' + cwd })
  await handler.sync()
  try {
    const repl = createRepl({
      prompt: 'vhd> ',
    })
    Object.assign(repl.context, vhdLib)
    repl.context.handler = handler
    repl.context.open = path => new Vhd(handler, relative(cwd, path))

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
