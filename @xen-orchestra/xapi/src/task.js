const ignoreErrors = require('promise-toolbox/ignoreErrors')

module.exports = class Task {
  create(name = 'untitled task', description) {
    // don't call `this.createTask` which might be overriden by
    // child class and already has the [XO] prefix
    return super.createTask(`[XO] ${name}`, description)
  }

  destroy(ref) {
    // pending task cannot be destroyed
    ignoreErrors.call(this.call('task.set_status', ref, 'cancelled'))
    return this.call('task.destroy', ref)
  }
}
