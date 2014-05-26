'use strict';

//====================================================================

var fs = require('fs');

//--------------------------------------------------------------------

var _ = require('lodash');
var l33t = require('l33teral');
var mkdirp = require('mkdirp');
var Promise = require('bluebird');
var xdg = require('xdg');

//====================================================================

var configPath = xdg.basedir.configPath('xo-cli');
var configFile = configPath +'/config.json';

var mkdirp = Promise.promisify(mkdirp);
var readFile = Promise.promisify(fs.readFile);
var writeFile = Promise.promisify(fs.writeFile);

//====================================================================

var load = exports.load = function () {
  return readFile(configFile).then(JSON.parse).catch(function () {
    return {};
  });
};

exports.get = function (path) {
  return load().then(function (config) {
    return l33t(config).tap(path);
  });
};

var save = exports.save = function (config) {
  return mkdirp(configPath).then(function () {
    return writeFile(configFile, JSON.stringify(config));
  });
};

exports.set = function (data) {
  return load().then(function (config) {
    return save(_.extend(config, data));
  });
};

exports.unset = function (paths) {
  return load().then(function (config) {
    var l33tConfig = l33t(config);
    [].concat(paths).forEach(function (path) {
      l33tConfig.purge(path, true);
    });
    return save(config);
  });
};
