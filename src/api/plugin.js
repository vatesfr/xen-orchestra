// Plugin object structure (using [JSON Schema](http://json-schema.org)):
({
  $schema: 'http://json-schema.org/draft-04/schema#',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      description: 'unique identifier for this plugin'
    },
    name: {
      type: 'string',
      description: 'unique human readable name for this plugin'
    },
    autoload: {
      type: 'boolean',
      description: 'whether this plugin is loaded on startup'
    },
    loaded: {
      type: 'boolean',
      description: 'whether or not this plugin is currently loaded'
    },
    unloadable: {
      type: 'boolean',
      default: 'true',
      description: 'whether or not this plugin can be unloaded'
    },
    configuration: {
      type: 'object',
      description: 'current configuration of this plugin (not present if none)'
    },
    configurationSchema: {
      $ref: 'http://json-schema.org/draft-04/schema#',
      description: 'configuration schema for this plugin (not present if not configurable)'
    }
  },
  required: [
    'id',
    'name',
    'autoload',
    'loaded'
  ]
})

// ===================================================================

export async function get () {
  return await this.getPlugins()
}

get.description = 'returns a list of all installed plugins'

get.permission = 'admin'

// -------------------------------------------------------------------

export async function configure ({ id, configuration }) {
  await this.configurePlugin(id, configuration)
}

configure.description = 'sets the configuration of a plugin'

configure.params = {
  id: {
    type: 'string'
  },
  configuration: {}
}

configure.permission = 'admin'

// -------------------------------------------------------------------

export async function disableAutoload ({ id }) {
  await this.disablePluginAutoload(id)
}

disableAutoload.description = ''

disableAutoload.params = {
  id: {
    type: 'string'
  }
}

disableAutoload.permission = 'admin'

// -------------------------------------------------------------------

export async function enableAutoload ({ id }) {
  await this.enablePluginAutoload(id)
}

enableAutoload.description = 'enables a plugin, allowing it to be loaded'

enableAutoload.params = {
  id: {
    type: 'string'
  }
}

enableAutoload.permission = 'admin'

// -------------------------------------------------------------------

export async function load ({ id }) {
  await this.loadPlugin(id)
}

load.description = 'loads a plugin'

load.params = {
  id: {
    type: 'string'
  }
}

load.permission = 'admin'

// -------------------------------------------------------------------

export async function unload ({ id }) {
  await this.unloadPlugin(id)
}

unload.description = 'unloads a plugin'

unload.params = {
  id: {
    type: 'string'
  }
}

unload.permission = 'admin'
