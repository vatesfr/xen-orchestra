'use strict'

const { Task } = require('../Task')

const noop = Function.prototype

exports.runTask = (...args) => Task.run(...args).catch(noop) // errors are handled by logs
