# xo-server-test-plugin

## Install

Either in xo-server's directory:

```
> npm i vatesfr/xo-server-test-plugin
```

Or globally:

```
> npm i -g vatesfr/xo-server-test-plugin
```

## Documentation

### Plugin life cycle

#### Initialization

When xo-server starts, it initializes plugins.

#### Loading plugins

After initializing the plugins, the xo-server load them.

#### Test

XO clients send data to xo-server for testing the configuration and saving it if successful.

### Principal Methods

#### The default export

It is just a factory function which will create an instance of the plugin. Usually it will be called only once, at startup.
Its only parameter is an object which currently only contains the instance of the currently running xo-server.

#### `configure(configuration)`

This method is called each time the plugin is (re-)configured.
Its only parameter is an object which contains the configuration values.

#### `load()`

This method is called to load the plugin.

#### `unload()`

This method is called to unload the plugin.

#### `test(data)`

This method is called if the test option is activated.
Its only parameter is an object which contains the test values.
