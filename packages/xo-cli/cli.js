'use strict';

//====================================================================

var _ = require('lodash');
var nomnom = require('nomnom');
var Promise = require('bluebird');

//--------------------------------------------------------------------

var prompt = require('./prompt');
var Xo = require('./xo');

//====================================================================

// Handles a promise in a CLI environment.
var handlePromise = function (promise) {
  promise.then(function (value) {
    if (_.isString(value))
    {
      console.log(value);
    }

    process.exit(0);
  }).catch(function (error) {
    if (_.isString(error))
    {
      console.error(error);
    }
    else if (_.isNumber(error))
    {
      process.exit(error);
    }

    process.exit(1);
  });
};

//--------------------------------------------------------------------

var connect = function (opts) {
  var config, xo;

  return Promise.try(function () {
    opts || (opts = {});

    // TODO: reads the configuration file.
    config = {
      server: 'ws://localhost:9000/api/',
    };

    if (!config.server)
    {
      throw 'no server to connect to!';
    }

    xo = new Xo(config.server);

    if (config.token && !opts.noAutoSignIn)
    {
      return xo.send('session.signInWithToken', {
        token: config.token,
      });
    }
  });
};

//--------------------------------------------------------------------

var addServer = function (host, username, password) {
  return connect().then(function (connection) {
    return connection.send('server.add', {
      host: host,
      username: username,
      password: password,
    });
  }).return('ok');
};

var register = function (url, email, password) {
  var xo;
  return Promise.try(function () {
    xo = new Xo(url);

    return xo.send('session.signInWithPassword', {
      email: email,
      password: password,
    });
  }).then(function (user) {
    console.log('Successfully logged with', user.email);

    return xo.send('token.create');
  }).then(function (token) {
    return getConfig().set({
      server: url,
      token: token,
    });
  });
};

//====================================================================

module.exports = function (argv) {
  nomnom.command('register')
    .help('signs in XO using email/password')
    .options({
      url: {
        help: 'URL of the API endpoint',
      },
      email: {
        help: 'email to use to connect',
      },
      password: {
        help: 'password to use to connect',
      },
    })
    .callback(function (opts) {
      Promise.try(function () {
        if (opts.url)
        {
          return prompt.input('URL').then(function (url) {
            opts.url = url;
          });
        }
      }).then(function () {
        if (!opts.email)
        {
          return prompt.input('Email').then(function (email) {
            opts.email = email;
          });
        }
      }).then(function () {
        if (!opts.password)
        {
          return prompt.password('Password').then(function (password) {
            opts.password = password;
          });
        }
      }).then(function () {
        return register(opts.url, opts.email, opts.password);
      });
    })
  ;

  nomnom.command('add-server')
    .help('adds a new server')
    .options({
      host: {
        help: 'hostname or ip of the server',
      },
      username: {
        help: 'username to use to connect',
      },
      password: {
        help: 'password to use to connect',
      },
    })
    .callback(function (opts) {
      Promise.try(function () {
        if (opts.host)
        {
          return prompt.input('Hostname or ip').then(function (host) {
            opts.host = host;
          });
        }
      }).then(function () {
        if (!opts.username)
        {
          return prompt.input('Username').then(function (username) {
            opts.username = username;
          });
        }
      }).then(function () {
        if (!opts.password)
        {
          return prompt.password('Password').then(function (password) {
            opts.password = password;
          });
        }
      }).then(function () {
        return addServer(opts.host, opts.username, opts.password);
      });
    })
  ;

  nomnom.parse(argv);
};
