# Web hooks

⚠ This feature is experimental!

## Configuration

The plugin "web-hooks" needs to be installed and loaded for this feature to work.

You can trigger an HTTP POST request to a URL when a Xen Orchestra API method is called.

* Go to Settings > Plugins > Web hooks
* Add new hooks
* For each hook, configure:
  * Method: the XO API method that will trigger the HTTP request when called
  * Type:
    * pre: the request will be sent when the method is called
    * post: the request will be sent after the method action is completed
  * URL: the full URL the requests will be sent to
* Save the plugin configuration

From now on, every time the methods you configured will be called by an XO client, a request will be sent to the corresponding URLs.

## Request content

```
POST / HTTP/1.1
Content-Type: application/json
```

Body (JSON):

```
{
  "type": "pre"|"post",
  "callId": <unique ID for this call to help match a pre-call and a post-call>,
  "method": <method name>,
  "params": <call parameters (JSON)>,
  "result": <call result on success (JSON)>,
  "error": <call result on error (JSON)>,
}
```

## Request handle

*Quick NodeJS example of how you may want to handle the requests*

```js
const http = require('http')
const { exec } = require('child_process')

http
  .createServer((req, res) => {
    let body
    req.on('data', chunk => {
      body += chunk
    })
    req.on('end', () => handleHook(body))
    res.end()
  })
  .listen(3000)

const handleHook = data => {
  const { method, params, type, result, error } = JSON.parse(data)

  // Log it
  console.log(`${Date.now()} [${method}|${type}] ${params} → ${result || error}`)

  // Run scripts
  exec(`./hook-scripts/${method}-${type}.sh`)
}
```
