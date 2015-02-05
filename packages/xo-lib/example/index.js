'use strict';

//====================================================================

var Xo = require('..');

//====================================================================

var xo = new Xo('localhost:9000');

xo.call('system.getMethodsInfo').then(function (methods) {
  console.log(methods);
});
