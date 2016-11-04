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

### The life cycle of plugins

#### First step: Initialising plugins

When the xo-server start, he initialize and load plugins. Then, he recuperates the configuration schema and the test schema to store them.

#### Second step: Get schemas

The xo-web recuperates the configuration schema and the test schema from xo-server to generate a UI.

#### Third step: Test configuration schema

Xo-web send an object which contains the configuration schema and the test schema to xo-server for testing the configuration and saving it if successful. 

### Principal Methods

#### The default export

It is  just a factory function which will create an instance of the plugin. Usually it will be called only once, at startup.
Its only parameter is an object which currently only contains the instance of the currently running xo-server.

#### Configure

This method is called each time the plugin is (re-configured).
Its only parameter is an object which contains the values putted on the confirmation form.

#### Load

This method is called to load the plugin.

#### Unload

This method is called to unload the plugin.

#### Test

This method is called if the test option is activated.
Its only parameter is an object which contains the values putted on the test form. 



