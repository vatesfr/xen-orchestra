const configurationSchema = {
  description:
    'Synchronize pools managed by Xen Orchestra with Netbox. Configuration steps and supported versions: https://docs.xen-orchestra.com/advanced#netbox.',
  type: 'object',
  properties: {
    endpoint: {
      type: 'string',
      title: 'Endpoint',
      description: 'Netbox URI (e.g. https://netbox.company.net/)',
    },
    allowUnauthorized: {
      type: 'boolean',
      title: 'Unauthorized certificates',
      description: 'Enable this if your Netbox instance uses a self-signed SSL certificate',
    },
    token: {
      type: 'string',
      title: 'Token',
      description:
        'Generate a token with write permissions from your Netbox interface (e.g. nbt_xxx.yyy for v2 tokens)',
    },
    pools: {
      type: 'array',
      title: 'Pools',
      description: 'Pools to synchronize with Netbox',
      items: {
        type: 'string',
        $type: 'pool',
      },
    },
    tags: {
      type: 'array',
      title: 'Ignored Tags',
      description: 'Tags not to sync',
      items: {
        type: 'string',
        $type: 'Tag'
      }
    },
    syncUsers: {
      type: 'boolean',
      title: 'Synchronize users',
      description:
        'Synchronize XO users as Netbox tenants and bind VM creators. For this to work, you need to assign the `uuid` custom field to the type "Tenancy > tenant".',
    },
    syncInterval: {
      type: 'number',
      title: 'Interval',
      description: 'Synchronization interval in hours - leave empty to disable auto-sync',
    },
    ignoreRfc1918: {
      type: 'boolean',
      title: 'Ignore RFC 1918 VM IPs',
      description:
        'Enable this if you do not want private IPs (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16) to be imported into Netbox',
    },
  },
  required: ['endpoint', 'token', 'pools'],
}

export { configurationSchema as default }
