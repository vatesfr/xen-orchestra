'use strict';

//====================================================================

var inquirer = require('inquirer');
var Promise = require('bluebird');

//====================================================================

var prompts = module.exports = function (prompts) {
  var deferred = Promise.defer();

  inquirer.prompt(prompts, deferred.resolve.bind(deferred));

  return deferred.promise;
};

prompts.input = function (message) {
  return prompts({
    type: 'input',
    name: 'question',
    message: message,
  }).get('question');
};

prompts.password = function (message) {
  return prompts({
    type: 'password',
    name: 'question',
    message: message,
  }).get('question');
};
