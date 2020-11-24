#!/usr/bin/env node

import { pDelay } from 'promise-toolbox'

import { createClient } from './'

async function main([url]) {
  const xapi = createClient({
    allowUnauthorized: true,
    url,
    watchEvents: false,
  })
  await xapi.connect()

  let loop = true
  process.on('SIGINT', () => {
    loop = false
  })

  const { pool } = xapi
  // eslint-disable-next-line no-unmodified-loop-condition
  while (loop) {
    await pool.update_other_config('xo:injectEvents', Math.random().toString(36).slice(2))
    await pDelay(1e2)
  }

  await pool.update_other_config('xo:injectEvents', null)
  await xapi.disconnect()
}

main(process.argv.slice(2)).catch(console.error)
