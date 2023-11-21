#!/usr/bin/env node

import { main } from 'xen-api/cli-lib.mjs'

import { Xapi } from './index.mjs'

main(opts => new Xapi(opts)).catch(console.error.bind(console, 'FATAL'))
