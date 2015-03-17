'use strict';

//====================================================================

var Bluebird = require('bluebird');
var createClient = require('ldapjs').createClient;
var escape = require('ldapjs/lib/filters/escape');

//====================================================================

function AuthLdap(conf) {
  var base = conf.base ? ',' + conf.base : '';

  this._provider = function (credentials) {
    return new Bluebird(function (resolve, reject) {
      var client = createClient({
        url: conf.uri,
      });

      client.bind(
        'uid=' + escape(credentials.username) + base,
        credentials.password,
        function (error) {
          if (error) {
            reject(error);
          } else {
            resolve();
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
