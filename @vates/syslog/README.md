<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# @vates/syslog

[![Package Version](https://badgen.net/npm/v/@vates/syslog)](https://npmjs.org/package/@vates/syslog) ![License](https://badgen.net/npm/license/@vates/syslog) [![PackagePhobia](https://badgen.net/bundlephobia/minzip/@vates/syslog)](https://bundlephobia.com/result?p=@vates/syslog) [![Node compatibility](https://badgen.net/npm/node/@vates/syslog)](https://npmjs.org/package/@vates/syslog)

> Syslog client: RFC 5424 messages over UDP, TCP or TLS, with a bounded buffer

## Install

Installation of the [npm package](https://npmjs.org/package/@vates/syslog):

```sh
npm install --save @vates/syslog
```

## Usage

```js
import { createClient } from '@vates/syslog'

const client = createClient('tls://syslog.company.lan', {
  appName: 'my-app',
  facility: 'authpriv',
})

await client.send('something happened', { msgid: 'event', severity: 'warning' })

// closes the connection, the client reconnects if it is used again
client.close()
```

### `createClient(uri, options)`

`uri`: `udp://host[:port]`, `tcp://host[:port]` or `tls://host[:port]`, the default port is `514`, or `6514` for TLS.

Options:

- `appName`: application name of the messages, `node` by default
- `facility`: one of `FACILITIES` (e.g. `user`, `authpriv`, `local0`), `user` by default
- `format`: `rfc5424` (default) or `rfc3164`
- `framing` (TCP and TLS): `lf` (default, each message followed by a line feed) or `octet-counting` (each message prefixed by its length, required by some servers for TLS, see [RFC 5425](https://datatracker.ietf.org/doc/html/rfc5425#section-4.3))
- `hostname`: host name of the messages, `os.hostname()` by default
- `ca` (TLS): contents of PEM certificate authorities to trust, in addition to the system ones
- `ignoreUnauthorized` (TLS): do not check the certificate of the server, `false` by default
- `connectTimeout`: in milliseconds, `10e3` by default
- `maxPendingBytes`: messages are rejected when more than this is waiting to be sent (e.g. the server is unreachable or does not read), `1 MiB` by default

A client uses at most one connection, opened when needed.

### `client.send(message, options)`

Returns a promise which resolves when the message has been handed to the system. Syslog has no acknowledgement: it does not mean that the server received it.

Options:

- `msgid`: message ID (RFC 5424 only)
- `severity`: one of `SEVERITIES` (e.g. `error`, `warning`, `informational`), `informational` by default
- `timestamp`: `Date` of the message, now by default

The promise rejects if the message cannot be sent, with the cause of the failure (e.g. connection refused, invalid certificate, too much data waiting).

### `client.close()`

Closes the connection, including a connection which is being established.

## Contributions

Contributions are _very_ welcomed, either on the documentation or on
the code.

You may:

- report any [issue](https://github.com/vatesfr/xen-orchestra/issues)
  you've encountered;
- fork and create a pull request.

## License

[ISC](https://spdx.org/licenses/ISC) © [Vates SAS](https://vates.fr)
