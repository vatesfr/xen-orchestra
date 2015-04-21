#!/usr/bin/env node

'use strict'

// ===================================================================

var Bluebird = require('bluebird')
var createRepl = require('repl').start
var eventToPromise = require('event-to-promise')
var pw = require('pw')

var Xo = require('./').Xo

// ===================================================================

var usage = ''

function main (args) {
  if (args[0] === '--help' || args[0] === 'h') {
    return usage
  }

  var xo = new Xo(args[0])

  return new Bluebird(function (resolve) {
    process.stdout.write('Password: ')
    pw(resolve)
  }).then(function (password) {
    return xo.signIn({
      email: args[1],
      password: password
    })
  }).then(function () {
    var repl = createRepl({})
    repl.context.xo = xo

    // Make the REPL waits for promise completion.
    var evaluate = Bluebird.promisify(repl.eval)
    repl.eval = function (cmd, context, filename, cb) {
      evaluate(cmd, context, filename)
        // See https://github.com/petkaantonov/bluebird/issues/594
        .then(function (result) { return result})
        .nodeify(cb)
    }

    return eventToPromise(repl, 'exit')
  })
}
module.exports = main

// ===================================================================

if (!module.parent) {
  require('exec-promise')(main)
}
