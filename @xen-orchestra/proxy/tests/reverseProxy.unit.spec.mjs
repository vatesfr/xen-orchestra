import ReverseProxy, { backendToLocalPath, localToBackendUrl } from '../app/mixins/reverseProxy.mjs'
import { deepEqual, strictEqual } from 'assert'

function makeApp(reverseProxies) {
  return {
    config: {
      get: () => reverseProxies,
    },
  }
}

const app = makeApp({
  https: {
    target: 'https://localhost:8080/remotePath/?baseParm=1#one=2&another=3',
    oneOption: true,
  },
  http: 'http://localhost:8080/remotePath/?baseParm=1#one=2&another=3',
})

// test localToBackendUrl
const expectedLocalToRemote = {
  https: [
    {
      local: '/proxy/v1/https/',
      remote: 'https://localhost:8080/remotePath/?baseParm=1#one=2&another=3',
    },
    {
      local: '/proxy/v1/https/sub',
      remote: 'https://localhost:8080/remotePath/sub?baseParm=1#one=2&another=3',
    },
    {
      local: '/proxy/v1/https/sub/index.html',
      remote: 'https://localhost:8080/remotePath/sub/index.html?baseParm=1#one=2&another=3',
    },
    {
      local: '/proxy/v1/https/sub?param=1',
      remote: 'https://localhost:8080/remotePath/sub?baseParm=1&param=1#one=2&another=3',
    },
    {
      local: '/proxy/v1/https/sub?baseParm=willbeoverwritten&param=willstay',
      remote: 'https://localhost:8080/remotePath/sub?baseParm=1&param=willstay#one=2&another=3',
    },
    {
      local: '/proxy/v1/https/sub?param=1#another=willoverwrite',
      remote: 'https://localhost:8080/remotePath/sub?baseParm=1&param=1#another=willoverwrite',
    },
  ],
}
const proxy = new ReverseProxy(app, { httpServer: { on: () => {} } })
for (const proxyId in expectedLocalToRemote) {
  for (const { local, remote } of expectedLocalToRemote[proxyId]) {
    const config = proxy._getConfigFromRequest({ url: local })
    const url = new URL(config.target)
    strictEqual(localToBackendUrl(config.path, url, local).href, remote, 'error converting to backend')
  }
}

// test backendToLocalPath
const expectedRemoteToLocal = {
  https: [
    {
      local: '/proxy/v1/https/',
      remote: 'https://localhost:8080/remotePath/',
    },
    {
      local: '/proxy/v1/https/sub/index.html',
      remote: '/remotePath/sub/index.html',
    },
    {
      local: '/proxy/v1/https/?baseParm=1#one=2&another=3',
      remote: '?baseParm=1#one=2&another=3',
    },
    {
      local: '/proxy/v1/https/sub?baseParm=1#one=2&another=3',
      remote: 'https://localhost:8080/remotePath/sub?baseParm=1#one=2&another=3',
    },
  ],
}

for (const proxyId in expectedRemoteToLocal) {
  for (const { local, remote } of expectedRemoteToLocal[proxyId]) {
    const config = proxy._getConfigFromRequest({ url: local })
    const targetUrl = new URL('https://localhost:8080/remotePath/?baseParm=1#one=2&another=3')
    const remoteUrl = new URL(remote, targetUrl)
    strictEqual(backendToLocalPath(config.path, targetUrl, remoteUrl), local, 'error converting to local')
  }
}

// test _getConfigFromRequest

const expectedConfig = [
  {
    local: '/proxy/v1/http/other',
    config: {
      target: 'http://localhost:8080/remotePath/?baseParm=1#one=2&another=3',
      options: {},
      path: '/proxy/v1/http',
    },
  },
  {
    local: '/proxy/v1/http',
    config: undefined,
  },

  {
    local: '/proxy/v1/other',
    config: undefined,
  },
  {
    local: '/proxy/v1/https/',
    config: {
      target: 'https://localhost:8080/remotePath/?baseParm=1#one=2&another=3',
      options: {
        oneOption: true,
      },
      path: '/proxy/v1/https',
    },
  },
]

for (const { local, config } of expectedConfig) {
  deepEqual(proxy._getConfigFromRequest({ url: local }), config)
}
