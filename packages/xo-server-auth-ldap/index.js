'use strict';

//====================================================================

var Bluebird = require('bluebird');
var createClient = require('ldapjs').createClient;
var escape = require('ldapjs/lib/filters/escape').escape;

//====================================================================

function AuthLdap(conf) {
  var base = conf.base ? ',' + conf.base : '';
  var clientOpts = {
    url: conf.uri,
  };

  this._provider = function (credentials) {
    var username = credentials.username;
    var password = credentials.password;
    if (username === undefined || password === undefined) {
      return Bluebird.reject(new Error('invalid credentials'));
    }

    return new Bluebird(function (resolve, reject) {
      var client = createClient(clientOpts);

      client.bind(
        'uid=' + escape(username) + base,
        password,
        function (error) {
          if (error) {
            reject(error);
          } else {
            resolve({ username });
          }

          client.unbind();
        }
      );
    });
  };
}

AuthLdap.prototype.load = function load(xo) {
  xo.registerAuthenticationProvider(this._provider);
};

AuthLdap.prototype.unload = function unload(xo) {
  xo.unregisterAuthenticationProvider(this._provider);
};

//====================================================================

exports = module.exports = function (conf) {
  return new AuthLdap(conf);
};
