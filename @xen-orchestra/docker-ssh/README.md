<!-- DO NOT EDIT MANUALLY, THIS FILE HAS BEEN GENERATED -->

# @xen-orchestra/docker-ssh

[![Package Version](https://badgen.net/npm/v/@xen-orchestra/docker-ssh)](https://npmjs.org/package/@xen-orchestra/docker-ssh) ![License](https://badgen.net/npm/license/@xen-orchestra/docker-ssh) [![PackagePhobia](https://badgen.net/bundlephobia/minzip/@xen-orchestra/docker-ssh)](https://bundlephobia.com/result?p=@xen-orchestra/docker-ssh) [![Node compatibility](https://badgen.net/npm/node/@xen-orchestra/docker-ssh)](https://npmjs.org/package/@xen-orchestra/docker-ssh)

> Docker Engine API client reaching the Docker socket of a remote host through SSH

## Install

Installation of the [npm package](https://npmjs.org/package/@xen-orchestra/docker-ssh):

```sh
npm install --save @xen-orchestra/docker-ssh
```

## Usage

Talks to the Docker Engine API of a remote host through SSH: the requests go over `direct-streamlocal@openssh.com` channels to the host's Docker socket, so nothing has to be installed on the host besides an OpenSSH server (≥ 6.7) and a user allowed to use the socket. It is the transport of the Docker integration of Xen Orchestra, and has no XO concepts.

- host key pinning (`SHA256:…` fingerprint), or trust on first use with `acceptUnknownHostKey` and `observedHostKey`
- API version negotiation (between `MIN_API_VERSION` and `MAX_API_VERSION`)
- one SSH connection per host, HTTP keep-alive over its channels, a bounded number of concurrent requests
- typed errors (`DockerError` and its `code`: `SSH_AUTH_FAILED`, `HOST_KEY_MISMATCH`, `DOCKER_SOCKET_UNREACHABLE`…)
- helpers: a connection pool with idle GC and a negative cache (`DockerConnectionPool`), a stats sampler (`DockerStatsSampler`), the log stream demuxer (`createStdcopyDemuxer`) and normalizers of the Docker responses

```js
import { readFileSync } from 'node:fs'
import { DockerConnection, normalizeContainerListEntry, DockerError } from '@xen-orchestra/docker-ssh'

const env = process.env // host, user, key path…
const connection = new DockerConnection({
  host: env.XO_DOCKER_TEST_SSH_HOST,
  port: Number(env.XO_DOCKER_TEST_SSH_PORT),
  username: env.XO_DOCKER_TEST_SSH_USER,
  privateKey: readFileSync(env.XO_DOCKER_TEST_SSH_KEY),
  socketPath: env.XO_DOCKER_TEST_SOCKET,
  // pinned host key: a different key is refused with HOST_KEY_MISMATCH
  hostKeyFingerprint: env.XO_DOCKER_TEST_SSH_FINGERPRINT,
})

try {
  await connection.connect()
  const { body: version } = await connection.request({ path: '/version' })
  console.log('Docker %s, API %s negotiated', version.Version, connection.apiVersion)

  const { body: containers } = await connection.request({
    path: '/containers/json',
    query: { all: 1, filters: JSON.stringify({ name: ['^/xo-', '^/demo-'] }) },
  })
  for (const container of containers.map(normalizeContainerListEntry)) {
    console.log('%s\t%s\t%s', container.name, container.state, container.image)
  }
} catch (error) {
  if (error instanceof DockerError) console.error(error.code, error.message)
  else throw error
} finally {
  await connection.close()
}
```

## Contributions

Contributions are _very_ welcomed, either on the documentation or on
the code.

You may:

- report any [issue](https://github.com/vatesfr/xen-orchestra/issues)
  you've encountered;
- fork and create a pull request.

## License

[AGPL-3.0-or-later](https://spdx.org/licenses/AGPL-3.0-or-later) © [Vates SAS](https://vates.fr)
