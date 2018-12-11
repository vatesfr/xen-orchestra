export async function get() {
  return /* await */ this.getPlugins()
}

get.description = 'returns a list of all installed plugins'

get.permission = 'admin'

// -------------------------------------------------------------------

export async function configure({ id, configuration }) {
  await this.configurePlugin(id, configuration)
}

configure.description = 'sets the configuration of a plugin'

configure.params = {
  id: {
    type: 'string',
  },
  configuration: {},
}

configure.permission = 'admin'

// -------------------------------------------------------------------

export async function disableAutoload({ id }) {
  await this.disablePluginAutoload(id)
}

disableAutoload.description = ''

disableAutoload.params = {
  id: {
    type: 'string',
  },
}

disableAutoload.permission = 'admin'

// -------------------------------------------------------------------

export async function enableAutoload({ id }) {
  await this.enablePluginAutoload(id)
}

enableAutoload.description = 'enables a plugin, allowing it to be loaded'

enableAutoload.params = {
  id: {
    type: 'string',
  },
}

enableAutoload.permission = 'admin'

// -------------------------------------------------------------------

export async function load({ id }) {
  await this.loadPlugin(id)
}

load.description = 'loads a plugin'

load.params = {
  id: {
    type: 'string',
  },
}

load.permission = 'admin'

// -------------------------------------------------------------------

export async function unload({ id }) {
  await this.unloadPlugin(id)
}

unload.description = 'unloads a plugin'

unload.params = {
  id: {
    type: 'string',
  },
}

unload.permission = 'admin'

// -------------------------------------------------------------------

export async function purgeConfiguration({ id }) {
  await this.purgePluginConfiguration(id)
}

purgeConfiguration.description = 'removes a plugin configuration'

purgeConfiguration.params = {
  id: {
    type: 'string',
  },
}

purgeConfiguration.permission = 'admin'

// ---------------------------------------------------------------------

export async function test({ id, data }) {
  await this.testPlugin(id, data)
}

test.description = 'Test a plugin with its current configuration'

test.params = {
  id: {
    type: 'string',
  },
  data: {
    optional: true,
  },
}

test.permission = 'admin'

// ---------------------------------------------------------------------
