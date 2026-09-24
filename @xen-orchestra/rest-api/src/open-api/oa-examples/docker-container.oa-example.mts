// Real payloads, captured from xo-server run from the sources against a rootless
// dockerd 29.8.1 reached through OpenSSH 10.0 (phase 3 end-to-end run of the
// Docker integration). Lists are shortened.

export const dockerContainerIds = [
  '/rest/v0/docker-containers/39a3cb1f-02ef-48ad-bda6-a3baf33d458c_40ce479c34637ad31b8ecd460d7d14aa0e2ed90dd73187afa6b284170418f1d5',
  '/rest/v0/docker-containers/39a3cb1f-02ef-48ad-bda6-a3baf33d458c_e35120a9e4facc5f42d55f464be996b1f47cdaa7c433d6a045857aab28d45c4d',
]

export const partialDockerContainers = [
  {
    name: 'xo-redis',
    state: 'running',
    status: 'Up 44 minutes',
    image: 'redis:alpine',
    href: '/rest/v0/docker-containers/39a3cb1f-02ef-48ad-bda6-a3baf33d458c_40ce479c34637ad31b8ecd460d7d14aa0e2ed90dd73187afa6b284170418f1d5',
  },
  {
    name: 'demo-web-1',
    state: 'running',
    status: 'Up 2 hours',
    image: 'nginx:alpine',
    href: '/rest/v0/docker-containers/39a3cb1f-02ef-48ad-bda6-a3baf33d458c_e35120a9e4facc5f42d55f464be996b1f47cdaa7c433d6a045857aab28d45c4d',
  },
  {
    name: 'demo-cache-1',
    state: 'running',
    status: 'Up 2 hours (healthy)',
    image: 'redis:alpine',
    href: '/rest/v0/docker-containers/39a3cb1f-02ef-48ad-bda6-a3baf33d458c_21c685423c29ddad1a7ba038fdc57f89f12a922310f65cd0f4fe2f2b245db8fa',
  },
]

export const dockerContainer = {
  id: '39a3cb1f-02ef-48ad-bda6-a3baf33d458c_1b5d79f4a1c9275c5f9e1fc50629ea85ca807fe1c70f03e528e35f4b6ce1963e',
  $engine: '39a3cb1f-02ef-48ad-bda6-a3baf33d458c',
  dockerId: '1b5d79f4a1c9275c5f9e1fc50629ea85ca807fe1c70f03e528e35f4b6ce1963e',
  name: 'xo-nginx',
  image: 'nginx:alpine',
  imageId: 'sha256:1ed1b0e1d7652937d6cbdaf4018c7b6fc009a7dd6c3047351e2eddda745de43f',
  command: "/docker-entrypoint.sh nginx -g 'daemon off;'",
  createdAt: 1790269461978,
  state: 'running',
  status: 'Up About a minute',
  ports: [
    {
      privatePort: 80,
      protocol: 'tcp',
      publicPort: 8080,
      ip: '0.0.0.0',
    },
  ],
  labels: {
    maintainer: 'NGINX Docker Maintainers <docker-maint@nginx.com>',
    'xo-test': 'fixture',
  },
  networks: [
    {
      name: 'bridge',
      ipAddress: '172.17.0.2',
    },
  ],
  mounts: [],
  startedAt: 1790276921786,
  finishedAt: 1790276921040,
  oomKilled: false,
  restartPolicy: {
    name: 'no',
    maximumRetryCount: 0,
  },
  restartCount: 0,
  tty: false,
  hostname: '1b5d79f4a1c9',
  workingDir: '/',
}

export const dockerContainerLogs = {
  entries: [
    {
      stream: 'stderr',
      timestamp: '2026-09-24T19:08:42.149710889Z',
      message: '2026/09/24 19:08:42 [notice] 1#1: start worker process 25',
    },
    {
      stream: 'stderr',
      timestamp: '2026-09-24T19:08:42.149716587Z',
      message: '2026/09/24 19:08:42 [notice] 1#1: start worker process 26',
    },
    {
      stream: 'stderr',
      timestamp: '2026-09-24T19:08:42.149721440Z',
      message: '2026/09/24 19:08:42 [notice] 1#1: start worker process 27',
    },
    {
      stream: 'stdout',
      timestamp: '2026-09-24T19:08:44.169435284Z',
      message: '172.17.0.1 - - [24/Sep/2026:19:08:44 +0000] "GET / HTTP/1.1" 200 896 "-" "curl/8.14.1" "-"',
    },
    {
      stream: 'stdout',
      timestamp: '2026-09-24T19:10:31.351689345Z',
      message: '172.17.0.1 - - [24/Sep/2026:19:10:31 +0000] "GET / HTTP/1.1" 200 896 "-" "curl/8.14.1" "-"',
    },
  ],
  truncated: false,
  timedOut: false,
  asOf: 1790277031383,
}
