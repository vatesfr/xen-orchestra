# Architecture

Xen Orchestra is based on a [client-server architecture](https://en.wikipedia.org/wiki/Client%E2%80%93server_model).

The server's role is to:

- maintain connections to Xen Servers;
- provide an up-to-date cache of their states (XAPI & RRDs);
- provide users management system with ACLs.

The client's only role is to provide an easy-to-use yet powerful interface to users.

## The server, [XO-Server](https://github.com/vatesfr/xo-server/tree/nodejs)

![XO-Server architecture overview](imgs/xo-server.svg?raw=true)

    xo-server/
    |-- node_modules/     # Node.js modules XO-Server is using.
    |
    |-- public/http/      # XO-Server embbeds an HTTP server which may
    |                     # be used to deliver XO-Web.
    |
    |-- src/
    |   |-- collection.js # Every XO entity is an instance of a class
    |   |-- model.js      # which inherits from “Model”.
    |   |                 # Collections of models are instances of
    |   |                 # which inherits from “Collection”.
    |   |
    |   |-- session.js    # A “session” is a model used to store various
    |   |                 # data related to the current session.
    |   |
    |   |-- xapi.js       # RPC connection to a Xen server.
    |   |
    |   |-- api.js        # API errors & methods definitions.
    |   |-- xo.js         # Definitions of models & collections used in
    |   |                 # XO.
    |   |
    |   `-- main.js       # Instanciation of “XO”, “API” and creations of
    |                     # XO-Server HTTP, WebSocket & TCP interfaces.
    |
    |-- tests/            # Not much tests for the moment but it would be
    |                     # nice to have the whole API covered through
    |                     # all interfaces (WebSocket & TCP).
    |
    |-- README.md
    |
    |-- package.json      # NPM description file, contains the dependencies.
    |
    `-- xo-server         # The shell script which runs the server.

## The client, [XO-Web](https://github.com/vatesfr/xo-web/tree/web-app)

