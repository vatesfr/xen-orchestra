#!/usr/bin/env node

import { createClient } from './index.mjs'
import { main } from './cli-lib.mjs'

main(createClient).catch(console.error.bind(console, 'FATAL'))
