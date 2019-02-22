const { ignoreErrors } = require('promise-toolbox')

module.exports = class {
  create(name = 'untitled task', description) {
    return super.createTask(`[XO] ${name}`, description)
  }

  destroy(ref) {
    // pending task cannot be destroyed
    ignoreErrors.call(this.call('task.set_status', ref, 'cancelled'))

    return this.call('task.destroy', ref)
  }
}
