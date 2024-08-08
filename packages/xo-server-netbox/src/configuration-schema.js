const configurationSchema = {
  description:
    'Synchronize pools managed by Xen Orchestra with Netbox. Configuration steps and supported versions: https://xen-orchestra.com/docs/advanced.html#netbox.',
  type: 'object',
  properties: {
    endpoint: {
      type: 'string',
      title: 'Endpoint',
      description: 'Netbox URI',
    },
    allowUnauthorized: {
      type: 'boolean',
      title: 'Unauthorized certificates',
      description: 'Enable this if your Netbox instance uses a self-signed SSL certificate',
    },
    token: {
      type: 'string',
      title: 'Token',
      description: 'Generate a token with write permissions from your Netbox interface',
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
  },
  required: ['endpoint', 'token', 'pools'],
}

export { configurationSchema as default }
