import { asCallback, fromCallback, fromEvent } from 'promise-toolbox'
import { getHandler } from '@xen-orchestra/fs'
import { resolve } from 'path'
import { start as createRepl } from 'repl'
import * as Vhd from 'vhd-lib'

export default async args => {
  const handler = getHandler({ url: 'file://' + process.cwd() })
  await handler.sync()
  try {
    const repl = createRepl({
      prompt: 'vhd> ',
    })
    Object.assign(repl.context, Vhd)
    repl.context.open = path => new Vhd.Vhd(handler, resolve(path))

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
