# VM Sync Hook

> This feature is currently _unstable_ and might change or be removed in the future.
>
> Feedbacks are very welcome on the [project bugtracker](https://github.com/vatesfr/xen-orchestra/issues).

> This feature is not currently supported for backups done with XO Proxy.

Before snapshotting (with or without memory, ie checkpoint), XO can notify the VM via an HTTP request.

A typical use case is to make sure the VM is in a consistent state during the snapshot process, for instance by making sure database writes are flushed to the disk.

> This request will only be sent if the VM is in a running state.

## Configuration

The feature is opt-in via a tag on the VM: `xo:notify-on-snapshot`.

By default, it will be an HTTPS request on the port `1727`, on the first IP address reported by the VM.

If the _VM Tools_ (i.e. management agent) are not installed on the VM or if you wish to use another URL, you can specify this in the tag: `xo:notify-on-snapshot=<URL>`.

To guarantee the request comes from XO, a secret must be provided in the `xo-server`'s (and `xo-proxy` if relevant) configuration:

```toml
[xapiOptions]
syncHookSecret = 'unique long string to ensure the request comes from XO'
```

XO will waits for the request to be answered before starting the snapshot, but will not wait longer than _1 minute_ by default. This timeout can be changed in the configuration as well:

```toml
[xapiOptions]

# Timeout in milliseconds
#
# Default: 60e3
syncHookTimeout = 300e3 # 5 minutes
```

## Specification

If the request fails for any reasons (including the timeout described in the above section), XO will go ahead with snapshot immediately.

```http
GET /sync HTTP/1.1
Authorization: Bearer dW5pcXVlIGxvbmcgc3RyaW5nIHRvIGVuc3VyZSB0aGUgcmVxdWVzdCBjb21lcyBmcm9tIFhP
```

When the snapshot is finished, another request will be sent:

```http
GET /post-sync HTTP/1.1
Authorization: Bearer dW5pcXVlIGxvbmcgc3RyaW5nIHRvIGVuc3VyZSB0aGUgcmVxdWVzdCBjb21lcyBmcm9tIFhP
```

The created snapshot will have the special `xo:synced` tag set to make it identifiable.

## Example server in Node

> This server requires [Node.js](https://nodejs.org/en/download/) to be installed on your system.

`index.cjs`:

```js
const exec = require('node:util').promisify(require('node:child_process').execFile)

const SECRET = 'unique long string to ensure the request comes from XO'

const HANDLERS = {
  __proto__: null,

  async '/sync'() {
    // actions to do before the VM is snapshotted

    // in this example, the Linux command `sync` is called:
    await exec('sync')
  },

  async '/post-sync'() {
    // actions to do after the VM is snapshotted
  },
}

function checkAuthorization(req) {
  try {
    const { authorization } = req.headers
    if (authorization !== undefined) {
      const parts = authorization.split('  ')
      if (parts.length >= 1 && parts[0].toLowerCase() === 'bearer') {
        return Buffer.from(parts[1], 'base64').toString() === SECRET
      }
    }
  } catch (error) {
    console.warn('checkAuthorization', error)
  }
  return false
}

async function main() {
  // generate a self-signed certificate
  const [, key, cert] =
    /^(-----BEGIN PRIVATE KEY-----.+-----END PRIVATE KEY-----\n)(-----BEGIN CERTIFICATE-----.+-----END CERTIFICATE-----\n)$/s.exec(
      (await exec('openssl', ['req', '-batch', '-new', '-x509', '-nodes', '-newkey', 'rsa:2048', '-keyout', '-']))
        .stdout
    )

  const server = require('node:https').createServer({ cert, key }, async function onRequest(req, res) {
    if (!checkAuthorization(req)) {
      res.statusCode = 403
      return res.end('Forbidden')
    }

    const handler = HANDLERS[req.url.split('?')[0]]
    if (handler === undefined || req.method !== 'GET') {
      res.statusCode = 404
      return res.end('Not Found')
    }

    try {
      await handler()

      res.statusCode = 200
      res.end('Ok')
    } catch (error) {
      console.warn(error)

      if (!res.headersSent) {
        res.statusCode = 500
        res.write('Internal Error')
      }
      res.end()
    }
  })

  await new Promise((resolve, reject) => {
    server
      .on('close', resolve)
      .on('error', reject)
      .listen(1727, () => {
        let { address, port } = server.address()
        if (address.includes(':')) {
          address = `[${address}]`
        }
        console.log('Server is listening on https://%s:%s', address, port)
      })
  })
}

main().catch(console.warn)
```

You can run it manually for testing:

```console
$ node index.cjs
Server is listening on https://[::]:1727
```
