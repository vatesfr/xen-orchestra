'use strict';

//====================================================================

var xoLib = require('..');

//====================================================================

var api = new xoLib.Api('localhost:9000');

api.call('system.getMethodsInfo').then(function (methods) {
  console.log(methods);
});
