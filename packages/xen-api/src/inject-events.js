#!/usr/bin/env node

import { pDelay } from 'promise-toolbox'

import { createClient } from './'

const xapi = (() => {
  const [, , url, user, password] = process.argv

  return createClient({
    auth: { user, password },
    url,
    watchEvents: false,
  })
})()

xapi
  .connect()

  // Get the pool record's ref.
  .then(() => xapi.call('pool.get_all'))

  // Injects lots of events.
  .then(([poolRef]) => {
    const loop = () =>
      pDelay
        .call(
          xapi.call('event.inject', 'pool', poolRef),
          10 // A small delay is required to avoid overloading the Xen API.
        )
        .then(loop)

    return loop()
  })
