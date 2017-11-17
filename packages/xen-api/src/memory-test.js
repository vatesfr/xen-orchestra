#!/usr/bin/env node

import { createClient } from './'

let i = 0
setInterval(() => {
  const usage = process.memoryUsage()
  console.log(
    '%s %s %s %s',
    i++,
    Math.round(usage.rss / 1e6),
    Math.round(usage.heapTotal / 1e6),
    Math.round(usage.heapUsed / 1e6)
  )
}, 1e2)

const [ , , url, user, password ] = process.argv
createClient({
  auth: { user, password },
  readOnly: true,
  url,
}).connect()
