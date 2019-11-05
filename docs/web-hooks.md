# Web hooks

⚠ This feature is experimental!

## Configuration

The plugin "web-hooks" needs to be installed and loaded for this feature to work.

You can trigger an HTTP POST request to any URL you want when any of the Xen Orchestra API methods is called.

* Go to Settings > Plugins > Web hooks
* Add new hooks
* For each hook, configure:
  * Method: the XO API method that will trigger the HTTP request when called
  * Type:
    * pre: the request will be sent right before the method is run
    * post: the request will be sent after the method action is fully completed
  * URL: the full URL the requests will be sent to
* Save the plugin configuration

From now on, everytime the methods you configured will be called by any of the XOA's clients, a request will be sent to the URLs bound to it.

## Request content

```
POST / HTTP/1.1
Content-Type: application/json
```

Body:

```json
{
  "type": "pre"|"post",
  "callId": <unique ID for this call to help match a pre-call and a post-call>,
  "method": <method name>,
  "params": <call parameters (JSON)>,
  "result": <call result if post type on success (JSON)>,
  "error": <call result if post type on error (JSON)>,
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
