#!/usr/bin/env node

import execPromise from 'exec-promise'
import { bind } from 'lodash'
import { fromCallback } from 'promise-toolbox'
import { readFile, writeFile } from 'fs'

import promptSchema, { input, password } from './prompt-schema'
import createPlugin, { configurationSchema } from './'

// ===================================================================

const CACHE_FILE = './ldap.cache.conf'

// -------------------------------------------------------------------

execPromise(async args => {
  const config = await promptSchema(
    configurationSchema,
    await fromCallback(cb => readFile(CACHE_FILE, 'utf-8', cb)).then(
      JSON.parse,
      () => ({})
    )
  )
  await fromCallback(cb =>
    writeFile(CACHE_FILE, JSON.stringify(config, null, 2), cb)
  ).then(
    () => {
      console.log('configuration saved in %s', CACHE_FILE)
    },
    error => {
      console.warn('failed to save configuration in %s', CACHE_FILE)
      console.warn(error.message)
    }
  )

  const plugin = createPlugin({})
  await plugin.configure(config)

  await plugin._authenticate(
    {
      username: await input('Username', {
        validate: input => !!input.length,
      }),
      password: await password('Password'),
    },
    bind(console.log, console)
  )
})
