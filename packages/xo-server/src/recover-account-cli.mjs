#!/usr/bin/env node

import appConf from 'app-conf'
import execPromise from 'exec-promise'
import pw from 'pw'

import Xo from './xo.mjs'
import { generateToken } from './utils.mjs'

execPromise(async ([name]) => {
  if (name === undefined || name === '--help' || name === '-h') {
    return `
xo-server-recover-account <user name or email>

    If the user does not exist, it is created, if it exists, updates
    its password, remove any configured OTP and resets its permission to Admin.
`
  }

  const support = name === '-s'
  if (support) {
    name = 'xoa-support'
  }

  let password = support
    ? ''
    : await new Promise(resolve => {
        process.stdout.write('Password (leave empty for random): ')
        pw(resolve)
      })

  if (password === '') {
    password = await generateToken(10)
    console.log('The generated password is', password)
  }

  const xo = new Xo({
    config: await appConf.load('xo-server', {
      appDir: new URL('..', import.meta.url).pathname,
      ignoreUnknownFormats: true,
    }),
  })

  await xo.hooks.startCore()

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
