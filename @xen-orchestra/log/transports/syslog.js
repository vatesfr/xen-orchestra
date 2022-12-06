'use strict'

const fromCallback = require('promise-toolbox/fromCallback')
// eslint-disable-next-line n/no-extraneous-require
const splitHost = require('split-host')
// eslint-disable-next-line n/no-extraneous-require
const { createClient, Facility, Severity, Transport } = require('syslog-client')

const LEVELS = require('../levels')

// https://github.com/paulgrove/node-syslog-client#syslogseverity
const LEVEL_TO_SEVERITY = {
  [LEVELS.FATAL]: Severity.Critical,
  [LEVELS.ERROR]: Severity.Error,
  [LEVELS.WARN]: Severity.Warning,
  [LEVELS.INFO]: Severity.Informational,
  [LEVELS.DEBUG]: Severity.Debug,
}

const facility = Facility.User

function createTransport(target) {
  if (typeof target === 'object') {
    target = target.target
  }

  const opts = {}
  if (target !== undefined) {
    if (target.startsWith('tcp://')) {
      target = target.slice(6)
      opts.transport = Transport.Tcp
    } else if (target.startsWith('udp://')) {
      target = target.slice(6)
      opts.transport = Transport.Udp
    }

    ;({ host: target, port: opts.port } = splitHost(target))
  }

  const client = createClient(target, opts)

  return log =>
    fromCallback(cb =>
      client.log(log.message, {
        facility,
        severity: LEVEL_TO_SEVERITY[log.level],
      })
    )
}

module.exports = exports = createTransport
