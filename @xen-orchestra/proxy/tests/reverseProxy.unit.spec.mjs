import ReverseProxy from '../dist/app/mixins/reverseProxy.mjs'
import { strictEqual } from 'assert'

function makeApp(reverseProxies) {
  return {
    config: {
      get: () => reverseProxies,
    },
  }
}

const app = makeApp({
  https: {
    path: '/https',
    target: 'https://localhost:8080/remotePath/?baseParm=1#one=2&another=3',
  },
})

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
    strictEqual(proxy.localToBackendUrl('https', local).href, remote, 'error converting to backend')
  }
}

const expectedRemoteToLocal = {
  https: [
    {
      local: '/proxy/v1/https/',
      remote: 'https://localhost:8080/remotePath/',
    },
    {
      local: '/proxy/v1/https/sub/index.html',
      remote: 'https://localhost:8080/remotePath/sub/index.html',
    },
    {
      local: '/proxy/v1/https/?baseParm=1#one=2&another=3',
      remote: 'https://localhost:8080/remotePath/?baseParm=1#one=2&another=3',
    },
    {
      local: '/proxy/v1/https/sub?baseParm=1#one=2&another=3',
      remote: 'https://localhost:8080/remotePath/sub?baseParm=1#one=2&another=3',
    },
  ],
}

for (const proxyId in expectedRemoteToLocal) {
  for (const { local, remote } of expectedRemoteToLocal[proxyId]) {
    const url = new URL(remote, 'https://localhost:8080/remotePath/?baseParm=1#one=2&another=3')
    strictEqual(proxy.backendToLocalPath('https', url), local, 'error converting to local')
  }
}
