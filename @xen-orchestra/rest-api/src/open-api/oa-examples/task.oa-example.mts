export const taskLocation = { taskId: '0m7kl0j9l' }

export const taskIds = ['/rest/v0/tasks/0mdd1basu', '/rest/v0/tasks/0mdd1t24g']

export const partialTasks = [
  {
    status: 'failure',
    id: '0mdd1basu',
    properties: {
      method: 'xoa.licenses.getSelf',
      params: {},
      name: 'API call: xoa.licenses.getSelf',
      userId: 'e531b8c9-3876-4ed9-8fd2-0476d5f825c9',
      type: 'api.call',
    },
    href: '/rest/v0/tasks/0mdd1basu',
  },
  {
    status: 'failure',
    id: '0mdd1t24g',
    properties: {
      method: 'xoa.licenses.getSelf',
      params: {},
      name: 'API call: xoa.licenses.getSelf',
      userId: 'e531b8c9-3876-4ed9-8fd2-0476d5f825c9',
      type: 'api.call',
    },
    href: '/rest/v0/tasks/0mdd1t24g',
  },
]

export const task = {
  id: '0mdd1basu',
  properties: {
    method: 'xoa.licenses.getSelf',
    params: {},
    name: 'API call: xoa.licenses.getSelf',
    userId: 'e531b8c9-3876-4ed9-8fd2-0476d5f825c9',
    type: 'api.call',
  },
  start: 1753098047598,
  status: 'failure',
  updatedAt: 1753098047696,
  end: 1753098047600,
  result: {
    message: 'invalid status closed, expected open',
    name: 'ConnectionError',
    stack:
      'ConnectionError: invalid status closed, expected open\n    at JsonRpcWebSocketClient._assertStatus (/home/debian/xoa/node_modules/jsonrpc-websocket-client/src/websocket-client.js:141:13)\n    at JsonRpcWebSocketClient.send (/home/debian/xoa/node_modules/jsonrpc-websocket-client/src/websocket-client.js:128:10)\n    at Peer.<anonymous> (/home/debian/xoa/node_modules/jsonrpc-websocket-client/src/index.js:47:12)\n    at Peer.emit (node:events:518:28)\n    at Peer.emit (/home/debian/xen-orchestra/@xen-orchestra/log/configure.js:52:17)\n    at Peer.push (/home/debian/xoa/node_modules/json-rpc-peer/src/index.js:196:52)\n    at /home/debian/xoa/node_modules/json-rpc-peer/src/index.js:142:12\n    at Promise._execute (/home/debian/xen-orchestra/node_modules/bluebird/js/release/debuggability.js:384:9)\n    at Promise._resolveFromExecutor (/home/debian/xen-orchestra/node_modules/bluebird/js/release/promise.js:518:18)\n    at new Promise (/home/debian/xen-orchestra/node_modules/bluebird/js/release/promise.js:103:10)\n    at Peer.request (/home/debian/xoa/node_modules/json-rpc-peer/src/index.js:139:12)\n    at JsonRpcWebSocketClient.call (/home/debian/xoa/node_modules/jsonrpc-websocket-client/src/index.js:63:23)\n    at Xoa.apply [as _getSelfLicenses] (/home/debian/xoa/packages/xo-server-xoa/src/index.js:929:26)\n    at Xo.call (file:///home/debian/xen-orchestra/packages/xo-server/src/xo-mixins/api.mjs:269:25)\n    at file:///home/debian/xen-orchestra/packages/xo-server/src/xo-mixins/api.mjs:421:33\n    at AsyncLocalStorage.run (node:internal/async_local_storage/async_hooks:91:14)\n    at Task.runInside (/home/debian/xen-orchestra/@vates/task/index.js:175:41)\n    at Task.run (/home/debian/xen-orchestra/@vates/task/index.js:159:31)\n    at run (file:///home/debian/xen-orchestra/packages/xo-server/src/xo-mixins/api.mjs:421:16)\n    at Api.#callApiMethod (file:///home/debian/xen-orchestra/packages/xo-server/src/xo-mixins/api.mjs:469:24)',
  },
}
