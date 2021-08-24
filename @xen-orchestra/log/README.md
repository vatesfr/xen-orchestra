<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# @xen-orchestra/log

[![Package Version](https://badgen.net/npm/v/@xen-orchestra/log)](https://npmjs.org/package/@xen-orchestra/log) ![License](https://badgen.net/npm/license/@xen-orchestra/log) [![PackagePhobia](https://badgen.net/bundlephobia/minzip/@xen-orchestra/log)](https://bundlephobia.com/result?p=@xen-orchestra/log) [![Node compatibility](https://badgen.net/npm/node/@xen-orchestra/log)](https://npmjs.org/package/@xen-orchestra/log)

> Logging system with decoupled producers/consumer

## Install

Installation of the [npm package](https://npmjs.org/package/@xen-orchestra/log):

```
> npm install --save @xen-orchestra/log
```

## Usage

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
    // if filter is a string, then it is pattern
    // (https://github.com/visionmedia/debug#wildcards) which is
    // matched against the namespace of the logs
    //
    // If it's an array, it will be handled as an array of filters
    // and the transport will be used if any one of them match the
    // current log
    filter: process.env.DEBUG,

    transport: transportConsole(),
  },
  {
    // only levels >= warn
    level: 'warn',

    transport,
  },
])

// send all global errors (uncaught exceptions, warnings, unhandled rejections)
// to this logger
catchGlobalErrors(createLogger('app'))
```

### Transports

#### Console

```js
import transportConsole from '@xen-orchestra/log/transports/console'

configure(transportConsole())
```

#### Email

Optional dependency:

```
> yarn add nodemailer pretty-format
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
> yarn add split-host syslog-client
```

Configuration:

```js
import transportSyslog from '@xen-orchestra/log/transports/syslog'

// By default, log to udp://localhost:514
configure(transportSyslog())

// But TCP, a different host, or a different port can be used
configure(transportSyslog('tcp://syslog.company.lan'))
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
