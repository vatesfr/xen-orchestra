const crypto = require('crypto')
const EventEmitter = require('events')
const { size, isEmpty } = require('lodash')

const preEvents = [
  {
    callId: 1,
    userId: 4545451,
    method: 'foo.bar1',
    params: {},
  },
  {
    callId: 2,
    userId: 45454512,
    method: 'foo.bar2',
    params: {},
  },
  {
    callId: 3,
    userId: 4545453,
    method: 'foo.bar3',
    params: {},
  },
]

const postEvents = [
  {
    callId: 3,
    result: '',
  },
  {
    callId: 1,
    result: '',
  },
  {
    callId: 2,
    result: '',
  },
]

// IMHO, it will be better to use a HMAC instead of a simple hash.
const createHash = data =>
  crypto
    .createHash('sha256')
    .update(JSON.stringify(data))
    .digest('hex')

class Audit {
  constructor(eventEmitter) {
    this._logs = {}

    eventEmitter.on('xo:preCall', this._onPreCall.bind(this))
    eventEmitter.on('xo:postCall', this._onPostCall.bind(this))
  }

  _onPreCall(data) {
    const logs = this._logs
    const log = {
      time: Date.now(),
      event: 'task.start',
      data,
    }

    if (!isEmpty(logs)) {
      log.parent = this._getLastHash()
    }

    // I separate 'task.start' with 'task.end' in different entries to be able
    // to include the parent hash in the current task hash without complications
    logs[createHash(log)] = log
  }

  _onPostCall(data) {
    const log = {
      time: Date.now(),
      event: 'task.end',
      data,
      parent: this._getLastHash(),
    }
    this._logs[createHash(log)] = log
  }

  _getLastHash() {
    const logs = this._logs
    return Object.keys(logs)[size(logs) - 1]
  }

  checkIntegrity(hash = this._getLastHash()) {
    const logs = this._logs
    const log = logs[hash]
    return (
      isEmpty(logs) ||
      (log !== undefined &&
        hash === createHash(log) &&
        (log.parent === undefined || this.checkIntegrity(log.parent)))
    )
  }

  getLogs() {
    return this._logs
  }
}

;(() => {
  const eventEmitter = new EventEmitter()
  const audit = new Audit(eventEmitter)

  preEvents.forEach(data => {
    eventEmitter.emit('xo:preCall', data)
  })

  postEvents.forEach(data => {
    eventEmitter.emit('xo:postCall', data)
  })

  console.log(audit.getLogs())
  console.log(audit.checkIntegrity())
})()
