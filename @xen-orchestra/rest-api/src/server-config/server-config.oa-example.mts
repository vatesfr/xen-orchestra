import type { ConfigSource } from './server-config.type.mjs'

export const mergedConfigExample = {
  redis: { uri: '**REDACTED**' },
  http: { port: 443, sessionSecret: '**REDACTED**' },
  datadir: '/var/lib/xo-server',
}

export const sourcesExample: ConfigSource[] = [
  { layer: 'vendor', path: '/usr/lib/xo-server/config.toml' },
  { layer: 'system', path: '/etc/xo-server/config.toml' },
  { layer: 'global', path: '/root/.config/xo-server/config.toml' },
]

export const sourceFileExample = {
  http: { port: 443 },
  redis: { uri: '**REDACTED**' },
}
