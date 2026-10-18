'use strict'

const { basename } = require('path')
const { readFileSync } = require('fs')
// eslint-disable-next-line n/no-extraneous-require
const { createClient } = require('@vates/syslog')

const { LEVELS } = require('../levels')

const LEVEL_TO_SEVERITY = {
  [LEVELS.FATAL]: 'critical',
  [LEVELS.ERROR]: 'error',
  [LEVELS.WARN]: 'warning',
  [LEVELS.INFO]: 'informational',
  [LEVELS.DEBUG]: 'debug',
}

// `config` is either the target or an object with:
// - `target`: `udp://host[:port]`, `tcp://host[:port]` or `tls://host[:port]`, UDP if there is no protocol
// - `certificateAuthorities`: paths to PEM files of certificate authorities to trust (TLS only)
// - the other options of `@vates/syslog`'s `createClient()`
function createTransport(config) {
  if (typeof config !== 'object' || config === null) {
    config = { target: config }
  }

  // eslint-disable-next-line no-unused-vars
  const { certificateAuthorities, target = 'localhost', type, ...opts } = config

  const client = createClient(/^[a-z]+:\/\//.test(target) ? target : `udp://${target}`, {
    // like the previous implementation
    appName: basename(process.title),
    ca:
      certificateAuthorities === undefined ? undefined : certificateAuthorities.map(path => readFileSync(path, 'utf8')),
    ...opts,
  })

  // failures must not be logged with the logger, which would send them to this
  // transport again, report the first one and the recovery on the console
  let nFailures = 0
  const onSent = () => {
    if (nFailures !== 0) {
      console.error('syslog transport: recovered after %d failure(s)', nFailures)
      nFailures = 0
    }
  }
  const onError = error => {
    if (nFailures++ === 0) {
      console.error(
        'syslog transport: failed to send logs, next failures will not be reported until it recovers',
        error
      )
    }
  }

  return log =>
    client
      .send(log.message, {
        msgid: log.namespace,
        severity: LEVEL_TO_SEVERITY[log.level],
        timestamp: log.time,
      })
      .then(onSent, onError)
}

module.exports = exports = createTransport
