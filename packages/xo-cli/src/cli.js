'use strict';

//====================================================================

var Bluebird = require('bluebird');
Bluebird.longStackTraces();

var multiline = require('multiline');
var chalk = require('chalk');
var forEach = require('lodash.foreach');
var pairs = require('lodash.pairs');
var Xo = require('xo-lib');

//--------------------------------------------------------------------

var config = require('./config');

//====================================================================

var connect = function () {
  return config.load().bind({}).then(function (config) {
    if (!config.server)
    {
      throw 'no server to connect to!';
    }

    if (!config.token)
    {
      throw 'no token available';
    }

    var xo = new Xo(config.server);

    return xo.call('session.signInWithToken', {
      token: config.token,
    }).return(xo);
  });
};

var wrap = function (val) {
  return function () {
    return val;
  };
};

//====================================================================

var help = wrap((function (pkg) {
  return multiline.stripIndent(function () {/*
    Usage:

      $name --register [<XO-Server URL>] [<username>] [<password>]
        Registers the XO instance to use.

      $name --list-commands [--json]
        Returns the list of available commands on the current XO instance.

      $name <command> [<name>=<value>]...
        Executes a command on the current XO instance.

    $name v$version
  */}).replace(/<([^>]+)>|\$(\w+)/g, function (_, arg, key) {
    if (arg) {
      return '<'+ chalk.yellow(arg) +'>';
    }

    if ('name' === key) {
      return chalk.bold(pkg[key]);
    }

    return pkg[key];
  });
})(require('../package')));

//--------------------------------------------------------------------

exports = module.exports = function (args) {
  if (!args || !args.length || '-h' === args[0]) {
    return help();
  }

  var fnName = args[0].replace(/^--|-\w/g, function (match) {
    if (match === '--')
    {
      return '';
    }

    return match[1].toUpperCase();
  });
  if (fnName in exports) {
    return exports[fnName](args.slice(1));
  }

  return exports.call(args);
};

//--------------------------------------------------------------------

exports.help = help;

exports.register = function (args) {
  var xo;
  return Bluebird.try(function () {
    xo = new Xo(args[0]);

    return xo.call('session.signInWithPassword', {
      email: args[1],
      password: args[2],
    });
  }).then(function (user) {
    console.log('Successfully logged with', user.email);

    return xo.call('token.create');
  }).then(function (token) {
    return config.set({
      server: xo._url,
      token: token,
    });
  });
};

exports.unregister = function () {
  return config.unset([
    'server',
    'token',
  ]);
};

exports.listCommands = function (args) {
  return connect().then(function (xo) {
    return xo.call('system.getMethodsInfo');
  }).then(function (methods) {
    if (args.indexOf('--json') !== -1)
    {
      return methods;
    }

    methods = pairs(methods);
    methods.sort(function (a, b) {
      a = a[0];
      b = b[0];
      if (a < b) {
        return -1;
      }
      return +(a > b);
    });

    var str = [];
    forEach(methods, function (method) {
      var name = method[0];
      var info = method[1];
      str.push(chalk.bold.blue(name));
      forEach(info.params || [], function (info, name) {
        str.push(' ');
        if (info.optional) {
          str.push('[');
        }
        str.push(name, '=<', info.type || 'unknown', '>');
        if (info.optional) {
          str.push(']');
        }
      });
      str.push('\n');
      if (info.description) {
        str.push('  ', info.description, '\n');
      }
    });
    return str.join('');
  });
};

var PARAM_RE = /^([^=]+)=(.*)$/;
exports.call = function (args) {
  if (!args.length) {
    throw 'missing command name';
  }

  var method = args.shift();
  var params = {};
  forEach(args, function (arg) {
    var matches;
    if (!(matches = arg.match(PARAM_RE))) {
      throw 'invalid arg: '+arg;
    }
    var value = matches[2];
    if (value === 'true') {
      value = true;
    }
    else if (value === 'false') {
      value = false;
    }

    params[matches[1]] = value;
  });

  return connect().then(function (xo) {
    return xo.call(method, params);
  });
};
