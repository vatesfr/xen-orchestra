export const pluginIds = ['/rest/v0/plugins/auth-ldap', '/rest/v0/plugins/transport-email']

export const partialPlugins = [
  {
    id: 'auth-ldap',
    loaded: true,
    href: '/rest/v0/plugins/auth-ldap',
  },
  {
    id: 'transport-email',
    loaded: false,
    href: '/rest/v0/plugins/transport-email',
  },
]

export const plugin = {
  id: 'transport-email',
  name: 'transport-email',
  autoload: true,
  description: 'xo-server plugin to send emails',
  loaded: true,
  keywords: ['email', 'orchestra', 'plugin', 'xen', 'xen-orchestra', 'xo-server'],
  unloadable: true,
  version: '1.2.0',
  configuration: {
    from: { address: 'xo@example.org' },
    transport: { host: 'smtp.example.org', port: 587, user: 'xo', password: 'obfuscated-q3oi6d9X8uenGvdLnHk2' },
  },
  configurationSchema: {
    type: 'object',
    properties: {
      from: {
        type: 'object',
        properties: { address: { type: 'string', format: 'email' } },
        required: ['address'],
      },
      transport: {
        type: 'object',
        properties: {
          host: { type: 'string' },
          port: { type: 'integer' },
          user: { type: 'string' },
          password: { type: 'string' },
        },
        required: ['host'],
      },
    },
    required: ['from', 'transport'],
  },
  configured: true,
  testable: true,
  testSchema: {
    type: 'object',
    properties: { to: { type: 'string', title: 'Recipient' } },
    required: ['to'],
  },
}
