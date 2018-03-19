# @xen-orchestra/log [![Build Status](https://travis-ci.org/vatesfr/xen-orchestra.png?branch=master)](https://travis-ci.org/vatesfr/xen-orchestra)

> ${pkg.description}

## Install

Installation of the [npm package](https://npmjs.org/package/@xen-orchestra/log):

```
> npm install --save @xen-orchestra/log
```

## Usage

Everywhere something should be logged:

```js
import { createLogger } from '@xen-orchestra/log'

const log = createLogger('xo-server-api')
log.warn('foo')
```

Then at application level you can choose how to handle these logs:

```js
import configure from '@xen-orchestra/log/configure'
import createConsoleTransport from '@xen-orchestra/log/transports/console'
import createEmailTransport from '@xen-orchestra/log/transports/email'

configure([
  {
    // if filter is a string, then it is pattern
    // (https://github.com/visionmedia/debug#wildcards) which is
    // matched against the namespace of the logs
    filter: process.env.DEBUG,

    transport: createConsoleTransport()
  },
  {
    // only levels >= warn
    level: 'warn',

    transport: createEmaileTransport({
      service: 'gmail',
      auth: {
        user: 'jane.smith@gmail.com',
        pass: 'H&NbECcpXF|pyXe#%ZEb'
      },
      from: 'jane.smith@gmail.com',
      to: [
        'jane.smith@gmail.com',
        'sam.doe@yahoo.com'
      ]
    })
  }
])
```

### Transports

#### Console

```js
import createConsoleTransport from '@xen-orchestra/log/transports/console'

configure(createConsoleTransport())
```

#### Email

Optional dependency:

```
> yarn add nodemailer pretty-format
```

Configuration:

```js
import createEmailTransport from '@xen-orchestra/log/transports/email'

configure(createEmailTransport({
  service: 'gmail',
  auth: {
    user: 'jane.smith@gmail.com',
    pass: 'H&NbECcpXF|pyXe#%ZEb'
  },
  from: 'jane.smith@gmail.com',
  to: [
    'jane.smith@gmail.com',
    'sam.doe@yahoo.com'
  ]
}))
```

#### Syslog

Optional dependency:

```
> yarn add split-host syslog-client
```

Configuration:

```js
import createSyslogTransport from '@xen-orchestra/log/transports/syslog'

// By default, log to udp://localhost:514
configure(createSyslogTransport())

// But TCP, a different host, or a different port can be used
configure(createSyslogTransport('tcp://syslog.company.lan'))
```

## Development

```
# Install dependencies
> yarn

# Run the tests
> yarn test

# Continuously compile
> yarn dev

# Continuously run the tests
> yarn dev-test

# Build for production (automatically called by npm install)
> yarn build
```

## Contributions

Contributions are *very* welcomed, either on the documentation or on
the code.

You may:

- report any [issue](https://github.com/vatesfr/xo-web/issues/)
  you've encountered;
- fork and create a pull request.

## License

ISC © [Vates SAS](https://vates.fr)
