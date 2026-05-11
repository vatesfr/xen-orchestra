import transportConsole from '@xen-orchestra/log/transports/console'
import { configure } from '@xen-orchestra/log/configure'

// Side-effect module: must be imported once, before any other module that
// emits logs. `@xen-orchestra/log` is silent until a transport is registered
// here, which is why test failures used to disappear without a trace.
//
// `level: 'info'` keeps info/warn/error/fatal always visible (test failures
// surface). `filter: process.env.DEBUG` lets debug-level logs through when
// the user opts in with e.g. `DEBUG='xo:qa-test:*'`.
configure([
  {
    filter: process.env.DEBUG,
    level: 'info',
    transport: transportConsole(),
  },
])
