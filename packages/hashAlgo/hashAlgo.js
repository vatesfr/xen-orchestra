const crypto = require('crypto')
const EventEmitter = require('events')
const { invert } = require('lodash')

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

const ALGORITHM = 'sha256'

// Format: $<algorithm>$<salt>$<encrypted>
//
// http://man7.org/linux/man-pages/man3/crypt.3.html#NOTES
const ALGORITHM_TO_ID = {
  md5: '1',
  sha256: '5',
  sha512: '6',
}

const ID_TO_ALGORITHM = invert(ALGORITHM_TO_ID)

const createHash = (data, algorithm = ALGORITHM) =>
  `$${ALGORITHM_TO_ID[algorithm]}$$${crypto
    .createHash(algorithm)
    .update(JSON.stringify(data))
    .digest('hex')}`

class Audit {
  constructor(eventEmitter) {
    this._logs = {}

    eventEmitter.on('xo:preCall', this._onPreCall.bind(this))
    eventEmitter.on('xo:postCall', this._onPostCall.bind(this))
  }

  _onPreCall(data) {
    const logs = this._logs
    const log = {
      data,
      event: 'methodCall.start',
      preHash: logs.lastHash,
      time: Date.now(),
    }
    if (logs.data === undefined) {
      logs.data = {}
    }
    logs.data[(logs.lastHash = createHash(log))] = log
  }

  _onPostCall(data) {
    const logs = this._logs
    const log = {
      data,
      event: 'methodCall.end',
      preHash: logs.lastHash,
      time: Date.now(),
    }
    logs.data[(logs.lastHash = createHash(log))] = log
  }

  checkIntegrity(hash = this._logs.lastHash) {
    const data = this._logs.data

    let entry = data[hash]
    if (entry === undefined) {
      return false
    }

    const algorithm = ID_TO_ALGORITHM[hash.slice(1, hash.indexOf('$', 1))]
    do {
      if (hash !== createHash(entry, algorithm)) {
        return false
      }
      hash = entry.preHash
    } while ((entry = data[hash]) !== undefined)

    return true
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
