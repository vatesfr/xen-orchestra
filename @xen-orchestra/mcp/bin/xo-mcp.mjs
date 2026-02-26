#!/usr/bin/env node

import { main } from '../dist/index.mjs'

main().catch(error => {
  console.error('Fatal error:', error instanceof Error ? error.message : error)
  process.exitCode = 1
})
