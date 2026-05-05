#!/usr/bin/env node

import { Worker } from 'worker_threads'
import appConf from 'app-conf'
import execPromise from 'exec-promise'
import pw from 'pw'

import { generateToken } from './utils.mjs'

function startSpinner() {
  if (!process.stdout.isTTY) return () => {}

  const worker = new Worker(
    `const { parentPort } = require('worker_threads')
    const { writeSync } = require('fs')
    const frames = [' | ', ' / ', ' - ', ' \\\\ ']
    let i = 0
    writeSync(1, frames[0])
    const id = setInterval(() => writeSync(1, '\\r' + frames[i++ % frames.length]), 100)
    parentPort.once('message', () => { clearInterval(id); writeSync(1, '\\r\\x1b[K') })`,
    { eval: true }
  )
  worker.on('error', () => {})

  return () => worker.postMessage('stop')
}

execPromise(async args => {
  if (args.length === 0 || args.length > 2 || args[0] === '-h' || args[0] === '--help') {
    return `
    Usage: xo-server-recover-account <user name or email> [<user password>]

    If the user does not exist, it is created; if it exists, updates
    its password, remove any configured OTP and resets its permission to Admin.
`
  }

  const support = args[0] === '-s'
  const name = support ? 'xoa-support' : args[0]

  let password =
    args.length === 2
      ? args[1]
      : support
        ? ''
        : await new Promise(resolve => {
            process.stdout.write('Password (leave empty for random): ')
            pw(resolve)
          })

  if (password === '') {
    password = await generateToken(10)
    console.log('The generated password is', password)
  }

  const stopSpinner = startSpinner()

  // Import xo.mjs now so we display the loader.
  const [{ default: Xo }, config] = await Promise.all([
    import('./xo.mjs'),
    appConf.load('xo-server', {
      appDir: new URL('..', import.meta.url).pathname,
      ignoreUnknownFormats: true,
    }),
  ])

  const xo = new Xo({ config })
  await xo.hooks.startCore()
  stopSpinner()

  const user = await xo.getUserByName(name, true)
  if (user !== null) {
    await xo.updateUser(user.id, {
      authProviders: null,
      password,
      permission: 'admin',
      preferences: { otp: null },
    })
    console.log(`user ${name} has been successfully updated`)
  } else {
    await xo.createUser({ name, password, permission: 'admin' })
    console.log(`user ${name} has been successfully created`)
  }

  await xo.hooks.stop()
})
