import fromCallback from 'promise-toolbox/fromCallback'
import splitHost from 'split-host' // eslint-disable-line node/no-extraneous-import node/no-missing-import
import startsWith from 'lodash/startsWith'
import { createClient, Facility, Severity, Transport } from 'syslog-client' // eslint-disable-line node/no-extraneous-import node/no-missing-import

import LEVELS from '../levels'

// https://github.com/paulgrove/node-syslog-client#syslogseverity
const LEVEL_TO_SEVERITY = {
  [LEVELS.FATAL]: Severity.Critical,
  [LEVELS.ERROR]: Severity.Error,
  [LEVELS.WARN]: Severity.Warning,
  [LEVELS.INFO]: Severity.Informational,
  [LEVELS.DEBUG]: Severity.Debug,
}

const facility = Facility.User

export default target => {
  const opts = {}
  if (target !== undefined) {
    if (startsWith(target, 'tcp://')) {
      target = target.slice(6)
      opts.transport = Transport.Tcp
    } else if (startsWith(target, 'udp://')) {
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
