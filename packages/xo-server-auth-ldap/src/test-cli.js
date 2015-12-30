#!/usr/bin/env node

import execPromise from 'exec-promise'
import { readFile, writeFile } from 'fs-promise'

import promptSchema, {
  input,
  password
} from './prompt-schema'
import createPlugin, {
  configurationSchema
} from './'

// ===================================================================

const CACHE_FILE = './ldap.cache.conf'

// -------------------------------------------------------------------

execPromise(async args => {
  const config = await promptSchema(
    configurationSchema,
    await readFile(CACHE_FILE, 'utf-8').then(
      JSON.parse,
      () => ({})
    )
  )
  await writeFile(CACHE_FILE, JSON.stringify(config, null, 2)).then(
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

  await plugin._authenticate({
    username: await input('Username', {
      validate: input => !!input.length
    }),
    password: await password('Password')
  }, ::console.log)
})
