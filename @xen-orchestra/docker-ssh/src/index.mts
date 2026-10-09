// Docker Engine API client reaching the Docker socket of a remote host through
// SSH (`direct-streamlocal@openssh.com` channels), with nothing to install on
// the host. No XO concepts here: see xo-server's `xo-mixins/docker.mjs`.

export * from './connection.mjs'
export * from './cooldown.mjs'
export * from './errors.mjs'
export * from './normalize.mjs'
// not `export *`: both export a `DEFAULT_IDLE_TIMEOUT`
export {
  DockerConnectionPool,
  type DockerConnectionFacade,
  type DockerConnectionState,
  type PoolableConnection,
} from './pool.mjs'
export * from './requests.mjs'
export { DockerStatsSampler, type DockerStatsSamplerOptions } from './stats-sampler.mjs'
export * from './ssh-http-agent.mjs'
export * from './stdcopy.mjs'
export * from './ttl-cache.mjs'
export type * from './wire.mjs'
