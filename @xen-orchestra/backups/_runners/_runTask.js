'use strict'
const { Task } = require('../Task.js')
const noop = Function.prototype
const runTask = (...args) => Task.run(...args).catch(noop) // errors are handled by logs

exports.runTask = runTask
