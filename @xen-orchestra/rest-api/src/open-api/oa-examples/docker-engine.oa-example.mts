// Real payloads, captured from xo-server run from the sources against a rootless
// dockerd 29.8.1 reached through OpenSSH 10.0 (phase 3 end-to-end run of the
// Docker integration, rerun after the review fixes). Lists are shortened.

export const dockerEngineId = {
  id: '8d834412-eb40-4328-a815-3fcc0989bd07',
}

export const dockerEngineIds = ['/rest/v0/docker-engines/8d834412-eb40-4328-a815-3fcc0989bd07']

export const partialDockerEngines = [
  {
    id: '8d834412-eb40-4328-a815-3fcc0989bd07',
    label: 'local rootless',
    connectionStatus: 'idle',
    href: '/rest/v0/docker-engines/8d834412-eb40-4328-a815-3fcc0989bd07',
  },
]

export const dockerEngine = {
  id: '8d834412-eb40-4328-a815-3fcc0989bd07',
  label: 'local rootless',
  host: '127.0.0.1',
  port: 2298,
  username: 'docker',
  socketPath: '/run/user/1000/docker.sock',
  hostKeyFingerprint: 'SHA256:G+4RawxzV+6SGkxauQY8Vqmu2KZ4ENCQu/YuxBIARDA',
  hostKeyAlgorithm: 'ssh-ed25519',
  resolvedHost: '127.0.0.1',
  hasPassword: false,
  hasPrivateKey: true,
  connectionStatus: 'idle',
}

export const dockerEngineInfo = {
  status: 'connected',
  asOf: 1790285367714,
  daemonId: '00000000-0000-4000-8000-000000000000',
  name: 'docker-host',
  engineVersion: '29.8.1',
  apiVersion: '1.43',
  minApiVersion: '1.40',
  operatingSystem: 'Debian GNU/Linux 13 (trixie)',
  osType: 'linux',
  kernelVersion: '6.12.101+deb13-amd64',
  architecture: 'x86_64',
  cpus: 6,
  memory: 5157838848,
  storageDriver: 'overlayfs',
  loggingDriver: 'json-file',
  cgroupDriver: 'systemd',
  cgroupVersion: '2',
  rootless: true,
  containers: {
    total: 9,
    running: 6,
    paused: 1,
    stopped: 2,
  },
  images: 3,
  warnings: ['WARNING: No cpuset support', 'WARNING: No io.weight support'],
  daemonApiVersion: '1.56',
  compose: {
    projects: [
      {
        name: 'demo',
        containers: 2,
        running: 2,
      },
    ],
  },
}

export const dockerEngineInfoAuthFailed = {
  status: 'auth-failed',
  asOf: 1790285380191,
  error: {
    code: 'SSH_AUTH_FAILED',
    message: 'SSH authentication failed',
    data: {
      host: '127.0.0.1',
      port: 2298,
      socketPath: '/run/user/1000/docker.sock',
    },
  },
}

export const dockerEngineTestResult = {
  ok: true,
  apiVersion: '1.43',
  engineVersion: '29.8.1',
  fingerprint: 'SHA256:G+4RawxzV+6SGkxauQY8Vqmu2KZ4ENCQu/YuxBIARDA',
  algorithm: 'ssh-ed25519',
}

export const dockerEngineTestFailure = {
  ok: false,
  fingerprint: 'SHA256:G+4RawxzV+6SGkxauQY8Vqmu2KZ4ENCQu/YuxBIARDA',
  algorithm: 'ssh-ed25519',
  error: {
    code: 'SSH_AUTH_FAILED',
    message: 'SSH authentication failed',
    data: {
      host: '127.0.0.1',
      port: 2298,
      socketPath: '/run/user/1000/docker.sock',
    },
  },
}

export const dockerEngineHostKeyUnknown = {
  error: 'the SSH host key is unknown',
  data: {
    fingerprint: 'SHA256:G+4RawxzV+6SGkxauQY8Vqmu2KZ4ENCQu/YuxBIARDA',
    algorithm: 'ssh-ed25519',
    code: 'HOST_KEY_UNKNOWN',
  },
}
