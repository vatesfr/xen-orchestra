'use strict'

const ignoreErrors = require('promise-toolbox/ignoreErrors')

module.exports = class Task {
  create(name = 'untitled task', description) {
    return this.createTask(`[XO] ${name}`, description)
  }

  destroy(ref) {
    // pending task cannot be destroyed
    ignoreErrors.call(this.call('task.set_status', ref, 'cancelled'))
    return this.call('task.destroy', ref)
  }
}
