// Real payloads recorded from Docker Engine 29.8.1 (rootless, cgroup v2), at the
// negotiated API version 1.43 (`GET /v1.43/…`). Host-specific values (user
// name, host name, paths, engine ID) have been scrubbed. Do not edit by hand:
// re-record them instead.

import type { DockerInfo, DockerVersion } from '../wire.mjs'

export const INFO = {
  Architecture: 'x86_64',
  BridgeNfIp6tables: false,
  BridgeNfIptables: false,
  CDISpecDirs: ['/etc/cdi', '/var/run/cdi', '/home/docker/.config/cdi', '/home/docker/.docker-run/cdi'],
  CPUSet: false,
  CPUShares: true,
  CgroupDriver: 'systemd',
  CgroupVersion: '2',
  ContainerdCommit: {
    Expected: '1294c24a7da8e5a793ed378161673abe94118892',
    ID: '1294c24a7da8e5a793ed378161673abe94118892',
  },
  Containers: 8,
  ContainersPaused: 1,
  ContainersRunning: 5,
  ContainersStopped: 2,
  CpuCfsPeriod: true,
  CpuCfsQuota: true,
  Debug: false,
  DefaultRuntime: 'runc',
  DockerRootDir: '/home/docker/.local/share/docker',
  Driver: 'overlayfs',
  DriverStatus: [['driver-type', 'io.containerd.snapshotter.v1']],
  ExperimentalBuild: false,
  GenericResources: null,
  HttpProxy: '',
  HttpsProxy: '',
  ID: '00000000-0000-4000-8000-000000000000',
  IPv4Forwarding: true,
  Images: 3,
  IndexServerAddress: 'https://index.docker.io/v1/',
  InitBinary: 'docker-init',
  InitCommit: {
    Expected: 'de40ad0',
    ID: 'de40ad0',
  },
  Isolation: '',
  KernelVersion: '6.12.101+deb13-amd64',
  Labels: [],
  LiveRestoreEnabled: false,
  LoggingDriver: 'json-file',
  MemTotal: 5157838848,
  MemoryLimit: true,
  NCPU: 6,
  NEventsListener: 0,
  NFd: 156,
  NGoroutines: 262,
  Name: 'docker-host',
  NoProxy: '',
  OSType: 'linux',
  OSVersion: '13',
  OomKillDisable: false,
  OperatingSystem: 'Debian GNU/Linux 13 (trixie)',
  PidsLimit: true,
  Plugins: {
    Authorization: null,
    Log: ['awslogs', 'fluentd', 'gcplogs', 'gelf', 'journald', 'json-file', 'local', 'splunk', 'syslog'],
    Network: ['bridge', 'host', 'ipvlan', 'macvlan', 'null', 'overlay'],
    Volume: ['local'],
  },
  ProductLicense: 'Community Engine',
  RegistryConfig: {
    AllowNondistributableArtifactsCIDRs: null,
    AllowNondistributableArtifactsHostnames: null,
    IndexConfigs: {
      'docker.io': {
        Mirrors: [],
        Name: 'docker.io',
        Official: true,
        Secure: true,
      },
    },
    InsecureRegistryCIDRs: ['::1/128', '127.0.0.0/8'],
    Mirrors: [],
  },
  RuncCommit: {
    Expected: 'v1.5.1-0-g8f2685a',
    ID: 'v1.5.1-0-g8f2685a',
  },
  Runtimes: {
    'io.containerd.runc.v2': {
      path: 'runc',
    },
    runc: {
      path: 'runc',
    },
  },
  SecurityOptions: ['name=seccomp,profile=builtin', 'name=rootless', 'name=cgroupns'],
  ServerVersion: '29.8.1',
  SwapLimit: true,
  Swarm: {
    ControlAvailable: false,
    Error: '',
    LocalNodeState: 'inactive',
    NodeAddr: '',
    NodeID: '',
    RemoteManagers: null,
  },
  SystemTime: '2026-09-24T16:56:16.993022218Z',
  Warnings: [
    'WARNING: No cpuset support',
    'WARNING: No io.weight support',
    'WARNING: No io.weight (per device) support',
    'WARNING: No io.max (rbps) support',
    'WARNING: No io.max (wbps) support',
    'WARNING: No io.max (riops) support',
    'WARNING: No io.max (wiops) support',
  ],
} satisfies DockerInfo

export const VERSION = {
  Platform: {
    Name: 'Docker Engine - Community',
  },
  Version: '29.8.1',
  ApiVersion: '1.56',
  MinAPIVersion: '1.40',
  Os: 'linux',
  Arch: 'amd64',
  Components: [
    {
      Name: 'Engine',
      Version: '29.8.1',
      Details: {
        ApiVersion: '1.56',
        Arch: 'amd64',
        BuildTime: '2026-09-15T16:27:24.000000000+00:00',
        Experimental: 'false',
        GitCommit: '464cd50',
        GoVersion: 'go1.26.8',
        KernelVersion: '6.12.101+deb13-amd64',
        MinAPIVersion: '1.40',
        Module: 'github.com/moby/moby/v2',
        ModuleVersion: 'v2.0.0+unknown',
        Os: 'linux',
      },
    },
    {
      Name: 'containerd',
      Version: 'v2.3.5',
      Details: {
        GitCommit: '1294c24a7da8e5a793ed378161673abe94118892',
      },
    },
    {
      Name: 'runc',
      Version: '1.5.1',
      Details: {
        GitCommit: 'v1.5.1-0-g8f2685a',
      },
    },
    {
      Name: 'docker-init',
      Version: '0.19.0',
      Details: {
        GitCommit: 'de40ad0',
      },
    },
    {
      Name: 'rootlesskit',
      Version: '3.1.0',
      Details: {
        ApiVersion: '1.1.2',
        NetworkDriver: 'slirp4netns',
        PortDriver: 'builtin',
        StateDir: '/home/docker/.docker-run/dockerd-rootless',
      },
    },
    {
      Name: 'slirp4netns',
      Version: '1.3.5',
      Details: {
        GitCommit: '7132ff3ba66cf0eebd8c9a83b9f23838bc84c518',
      },
    },
  ],
  GitCommit: '464cd50',
  GoVersion: 'go1.26.8',
  KernelVersion: '6.12.101+deb13-amd64',
  BuildTime: '2026-09-15T16:27:24.000000000+00:00',
} satisfies DockerVersion
