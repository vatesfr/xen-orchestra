# Web hooks

⚠ This feature is experimental!

## Configuration

The plugin "web-hooks" needs to be installed and loaded for this feature to work.

You can trigger an HTTP POST request to a URL when a Xen Orchestra API method is called.

- Go to Settings > Plugins > Web hooks
- Add new hooks
- For each hook, configure:
  - Method: the XO API method that will trigger the HTTP request when called
  - Type:
    - pre: the request will be sent when the method is called
    - post: the request will be sent after the method action is completed
    - pre/post: both
  - URL: the full URL which the requests will be sent to
- Save the plugin configuration

From now on, a request will be sent to the corresponding URLs when a configured method is called by an XO client.

## Request content

```
POST / HTTP/1.1
Content-Type: application/json
```

The request's body is a JSON string representing an object with the following properties:

- `type`: `"pre"` or `"post"`
- `callId`: unique ID for this call to help match a pre-call and a post-call
- `userId`: unique internal ID of the user who performed the call
- `userName`: login/e-mail address of the user who performed the call
- `method`: name of the method that was called (e.g. `"vm.start"`)
- `params`: call parameters (object)
- `timestamp`: epoch timestamp of the beginning ("pre") or end ("post") of the call in ms
- `duration`: duration of the call in ms ("post" hooks only)
- `result`: call result on success ("post" hooks only)
- `error`: call result on error ("post" hooks only)

## Request handling

_Quick Node.js example of how you may want to handle the requests_

```js
const http = require('http')
const { exec } = require('child_process')

http
  .createServer((req, res) => {
    let body = ''
    req.on('data', chunk => {
      body += chunk
    })
    req.on('end', () => handleHook(body))
    res.end()
  })
  .listen(3000)

const handleHook = data => {
  const { method, params, type, result, error, timestamp } = JSON.parse(data)

  // Log it
  console.log(
    `${new Date(
      timestamp
    ).toISOString()} [${method}|${type}] ${params} → ${result || error}`
  )

  // Run scripts
  exec(`./hook-scripts/${method}-${type}.sh`)
}
```
