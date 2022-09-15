# VM Sync Hook

> This feature is currently _unstable_ and might change or be removed in the future.
>
> Feedbacks are very welcome on the [project bugtracker](https://github.com/vatesfr/xen-orchestra/issues).

Before snapshotting (with or without memory, ie checkpoint), XO can notify the VM via an HTTP request.

A typical use case is to make sure the VM is in a consistent state during the snapshot process, for instance by making sure database writes are flushed to the disk.

## Configuration

The feature is opt-in via a tag on the VM: `xo:notify-on-snapshot`.

By default, it will be an HTTP request on the port `1727`, on the first IP address reported by the VM.

If the _VM Tools_ (i.e. management agent) are not installed on the VM or if you which to use another URL, you can specify this in the tag: `xo:notify-on-snapshot=<URL>`.

## Specification

XO will waits for the request to be answered before starting the snapshot, but will not wait longer than _1 minute_.

If the request fails for any reason, XO will go ahead with snapshot immediately.

```http
GET /sync HTTP/1.1
```

When the snapshot is finished, another request will be sent:

```http
GET /post-sync HTTP/1.1
```

## Example server in Node

`index.mjs`:

```js
const { createServer } = require('node:http')
const exec = require('node:util').promisify(require('node:child_process').exec)

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

createServer(async function onRequest(req, res) {
  const handler = HANDLERS[req.url.split('?')[0]]
  if (handler === undefined || req.method !== 'GET') {
    res.statusCode(404)
    res.end('Not Found')
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
}).listen(1727)
```
