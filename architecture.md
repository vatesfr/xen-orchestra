# Architecture

Xen Orchestra is based on a [client-server architecture](https://en.wikipedia.org/wiki/Client%E2%80%93server_model).

The server's role is to:

- maintain connections to Xen Servers;
- provide an up-to-date cache of their states (XAPI & RRDs);
- provide users management system with ACLs.

The client's only role is to provide an easy-to-use yet powerful interface to users.

## The server, [XO-Server](https://github.com/vatesfr/xo-server)

![XO-Server architecture overview](https://xen-orchestra.com/wp-content/uploads/2014/05/xo-arch-e1400585233111.jpg)

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

## The client, [XO-Web](https://github.com/vatesfr/xo-web)

    xo-web/
    |-- public/
    |   |-- css/          # CSS stylesheets of dependencies (Bootstrap,
    |   |                 # FontAwesome, …) and XO-Web.
    |   |
    |   |-- font/         # Fonts used in XO-Web (FontAwesome).
    |   |-- img/          # Images
    |   |
    |   |-- js/           # All JavaScript used in XO-Web (dependencies
    |   |   |             # are not listed below).
    |   |   |
    |   |   |-- network-graph.js  # Code used to generate the graph.
    |   |   |
    |   |   |-- xo.helpers.js     # Old code which should be migrated
    |   |   |                     # in xo.js
    |   |   |
    |   |   `-- xo.js             # Contains all the logic of XO-Web.
    |   |
    |   `-- index.html    # Layout and templates of XO-Web.
    |
    `-- vendor/           # Contains all dependencies.

## Technologies

### [JSON-RPC](http://www.jsonrpc.org/specification) over [WebSocket](https://en.wikipedia.org/wiki/WebSocket)

Used for communication between the server and its clients.

WebSocket has been choosen because it is a full-duplex real-time protocol implemented in web browsers.

### [Node.js](http://nodejs.org/)

The framework Node.js is used to develop XO-Server in JavaScript, the same language already used in XO-Web.

It's perfectly fit to run efficiently network services.

### [Redis](http://redis.io/)

This NoSQL data store is used by XO-Server to store persistent data such as users, Xen servers, …

### [AngularJS](https://angularjs.org/)

AngularJS is an open-source web application framework, maintained by Google and community, that assists with creating single-page applications, one-page web applications that only require HTML, CSS, and JavaScript on the client side.


