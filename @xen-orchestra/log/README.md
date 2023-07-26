<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# @xen-orchestra/log

[![Package Version](https://badgen.net/npm/v/@xen-orchestra/log)](https://npmjs.org/package/@xen-orchestra/log) ![License](https://badgen.net/npm/license/@xen-orchestra/log) [![PackagePhobia](https://badgen.net/bundlephobia/minzip/@xen-orchestra/log)](https://bundlephobia.com/result?p=@xen-orchestra/log) [![Node compatibility](https://badgen.net/npm/node/@xen-orchestra/log)](https://npmjs.org/package/@xen-orchestra/log)

> Logging system with decoupled producers/consumer

## Install

Installation of the [npm package](https://npmjs.org/package/@xen-orchestra/log):

```sh
npm install --save @xen-orchestra/log
```

## Usage

### Producers

Everywhere something should be logged:

```js
import { createLogger } from '@xen-orchestra/log'

const log = createLogger('my-module')

log.debug('only useful for debugging')
log.info('this information is relevant to the user')
log.warn('something went wrong but did not prevent current action')
log.error('something went wrong')
log.fatal('service/app is going down')

// you can add contextual info
log.debug('new API request', {
  method: 'foo',
  params: [ 'bar', 'baz' ]
  user: 'qux'
})

// by convention, errors go into the `error` field
log.error('could not join server', {
  error,
  server: 'example.org',
})
```

### Consumer

Then, at application level, configure the logs are handled:

```js
import { createLogger } from '@xen-orchestra/log'
import { configure, catchGlobalErrors } from '@xen-orchestra/log/configure'
import transportConsole from '@xen-orchestra/log/transports/console'
import transportEmail from '@xen-orchestra/log/transports/email'

const transport = transportEmail({
  service: 'gmail',
  auth: {
    user: 'jane.smith@gmail.com',
    pass: 'H&NbECcpXF|pyXe#%ZEb',
  },
  from: 'jane.smith@gmail.com',
  to: ['jane.smith@gmail.com', 'sam.doe@yahoo.com'],
})

configure([
  {
    filter: process.env.DEBUG,

    transport: transportConsole(),
  },
  {
    // only levels >= warn
    level: 'warn',

    transport,
  },
  {
    type: 'email',

    service: 'gmail',
    auth: {
      user: 'jane.smith@gmail.com',
      pass: 'H&NbECcpXF|pyXe#%ZEb',
    },
    from: 'jane.smith@gmail.com',
    to: ['jane.smith@gmail.com', 'sam.doe@yahoo.com'],
  },
])

// send all global errors (uncaught exceptions, warnings, unhandled rejections)
// to this logger
catchGlobalErrors(createLogger('app'))
```

A transport as expected by `configure(transport)` can be:

- a function that will receive emitted logs;
- an object with a `type` property and options which will be used to create a transport (see next section);
- an object with a nested `transport` which will be used if one of the following conditions is fulfilled:
  - `filter`: [pattern](https://github.com/visionmedia/debug#wildcards) which is matched against the log namespace (can also be an array of filters);
  - `level`: the minimal level of accepted logs;
- an array of transports.

### Transports

#### Console

```js
import transportConsole from '@xen-orchestra/log/transports/console'

configure(transportConsole())
```

#### Email

Optional dependency:

```
> npm add nodemailer pretty-format
```

Configuration:

```js
import transportEmail from '@xen-orchestra/log/transports/email'

configure(
  transportEmail({
    service: 'gmail',
    auth: {
      user: 'jane.smith@gmail.com',
      pass: 'H&NbECcpXF|pyXe#%ZEb',
    },
    from: 'jane.smith@gmail.com',
    to: ['jane.smith@gmail.com', 'sam.doe@yahoo.com'],
  })
)
```

#### Syslog

Optional dependency:

```
> npm add split-host syslog-client
```

Configuration:

```js
import transportSyslog from '@xen-orchestra/log/transports/syslog'

// By default, log to udp://localhost:514
configure(transportSyslog())

// But TCP, a different host, or a different port can be used
configure(transportSyslog({ target: 'tcp://syslog.company.lan' }))
```

### Helpers

#### Dedupe

> Wraps a transport to limit the number of duplicate logs.

```js
import { dedupe } from '@xen-orchestra/log/dedupe'

configure(
  dedupe({
    timeout: 500e3, // default to 600e3, ie 10 minutes
    transport: console.log,
  })
)
```

Duplicate logs will be buffered for `timeout` milliseconds or until a different log is emitted, at which time a dedicated log entry is emitted which indicate the number of duplicates that occured.

```js
const logger = createLogger('app')

// Log some duplicate messages
logger.error('Something went wrong')
logger.error('Something went wrong')
logger.error('Something went wrong')

// Log a different message
logger.info('This is a different message')
```

In this example, the first three log entries are identical and the last two will be treated as duplicates. They will be grouped together and sent to the transport as a single log with `nDuplicates: 2` data when a different log entry is emitted (or after the timeout as elasped if there weren't one).

The output in the console would look something like:

```
app ERROR Something went wrong
app ERROR duplicates of the previous log were hidden { nDuplicates: 2 }
app INFO This is a different message
```

## Contributions

Contributions are _very_ welcomed, either on the documentation or on
the code.

You may:

- report any [issue](https://github.com/vatesfr/xen-orchestra/issues)
  you've encountered;
- fork and create a pull request.

## License

[ISC](https://spdx.org/licenses/ISC) © [Vates SAS](https://vates.fr)
