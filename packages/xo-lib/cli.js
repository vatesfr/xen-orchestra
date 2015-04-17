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

    return eventToPromise(repl, 'exit')
  })
}
module.exports = main

// ===================================================================

if (!module.parent) {
  require('exec-promise')(main)
}
