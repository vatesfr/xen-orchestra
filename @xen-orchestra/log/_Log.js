'use strict'

module.exports = function Log(data, level, namespace, message) {
  this.data = data
  this.level = level
  this.namespace = namespace
  this.message = message
  this.time = new Date()
}
