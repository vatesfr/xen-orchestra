export default {
  $schema: 'http://json-schema.org/draft-04/schema#',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      description: 'unique identifier for this plugin',
    },
    name: {
      type: 'string',
      description: 'unique human readable name for this plugin',
    },
    autoload: {
      type: 'boolean',
      description: 'whether this plugin is loaded on startup',
    },
    loaded: {
      type: 'boolean',
      description: 'whether or not this plugin is currently loaded',
    },
    unloadable: {
      type: 'boolean',
      default: true,
      description: 'whether or not this plugin can be unloaded',
    },
    configuration: {
      type: 'object',
      description: 'current configuration of this plugin (not present if none)',
    },
    configurationSchema: {
      $ref: 'http://json-schema.org/draft-04/schema#',
      description: 'configuration schema for this plugin (not present if not configurable)',
    },
    testable: {
      type: 'boolean',
      description: 'whether or not this plugin can be tested',
    },
    testSchema: {
      $ref: 'http://json-schema.org/draft-04/schema#',
      description: 'test schema for this plugin',
    },
  },
  required: ['id', 'name', 'autoload', 'loaded'],
}
