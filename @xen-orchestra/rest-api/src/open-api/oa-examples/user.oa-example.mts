export const userIds = [
  '/rest/v0/users/088124f3-41b6-4258-9653-6eedc7b46111',
  '/rest/v0/users/a8715f02-20e7-4881-8b02-28ce2260c39d',
]

export const partialUsers = [
  {
    permission: 'none',
    name: 'testName',
    id: '088124f3-41b6-4258-9653-6eedc7b46111',
    href: '/rest/v0/users/088124f3-41b6-4258-9653-6eedc7b46111',
  },
  {
    permission: 'none',
    id: 'a8715f02-20e7-4881-8b02-28ce2260c39d',
    href: '/rest/v0/users/a8715f02-20e7-4881-8b02-28ce2260c39d',
  },
]

export const user = {
  email: 'admin@admin.net',
  permission: 'admin',
  pw_hash: '***obfuscated***',
  groups: ['7d98fee4-3357-41a7-ac3f-9124212badb7', '7981ba62-c395-4546-bfa4-d1261653a77f'],
  name: 'admin@admin.net',
  preferences: {},
  id: '722d17b9-699b-49d2-8193-be1ac573d3de',
}

export const userId = { id: '722d17b9-699b-49d2-8193-be1ac573d3de' }

export const authenticationTokens = [
  {
    client: {
      id: 'w574r066b5',
    },
    created_at: 1754383334192,
    description: 'xo-cli@0.32.2 - fedora-2.home - Linux x86_64',
    user_id: '722d17b9-699b-49d2-8193-be1ac573d3de',
    expiration: 1756975334192,
    last_uses: {
      '::1': {
        timestamp: 1754383346794,
      },
    },
    id: 'LB_DqCNhcmAoyiioNnajySHIYHrWfsIhYSYn3n8FfJA',
  },
  {
    client: {
      id: 'nemyw6m3dx',
    },
    created_at: 1754471974241,
    description: 'Mozilla/5.0 (X11; Linux x86_64; rv:141.0) Gecko/20100101 Firefox/141.0',
    user_id: '722d17b9-699b-49d2-8193-be1ac573d3de',
    expiration: 1754507974241,
    last_uses: {
      '::ffff:127.0.0.1': {
        timestamp: 1754475904704,
      },
    },
    id: 'ktdlq-BX_GdS5N8MR0v7QIuoSymBw4Ys4EOxsOdqpnE',
  },
]

export const authenticationToken = {
  token: {
    client: {
      id: 'my-fav-client',
    },
    created_at: 1760346600297,
    description: 'token for CLI usage',
    id: 'fhIUz8AtMLndzMd3ksfoTpHb0tWyKHmT6-M3o_hUbRg',
    user_id: '722d17b9-699b-49d2-8193-be1ac573d3de',
    expiration: 1760350200297,
  },
}
