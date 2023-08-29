#!/usr/bin/env node

import { Xapi } from './index.mjs'
import CLI from 'xen-api/dist/cli.js'

CLI.default(opts => new Xapi(opts)).catch(console.error.bind(console, 'FATAL'))
