import { createClient } from '@vates/syslog'
import { createLogger } from '@xen-orchestra/log'

const log = createLogger('xo:xo-server-audit:syslog')

const SEVERITIES = {
  signInFailed: 'warning',
}

// sends audit records, as JSON, to a syslog server
export class SyslogForwarder {
  constructor({ ca, facility = 'authpriv', framing, ignoreUnauthorized, uri }) {
    this._client = createClient(uri, { appName: 'xo-audit', ca, facility, framing, ignoreUnauthorized })
    this._nFailures = 0
  }

  // the forwarder can still be used afterwards, it will reconnect
  close() {
    this._client.close()
  }

  forward(record) {
    this._client
      .send(JSON.stringify(record), {
        msgid: record.event,
        severity: SEVERITIES[record.event] ?? 'informational',
        timestamp: new Date(record.time),
      })
      .then(
        () => this._onResult(),
        error => this._onResult(error)
      )
  }

  test() {
    return this._client.send('test message from the audit plugin of Xen Orchestra', { msgid: 'test' })
  }

  // only report the first failure and the recovery to avoid a warning per record
  _onResult(error) {
    if (error === undefined) {
      if (this._nFailures !== 0) {
        log.info('forwarding to syslog recovered', { nFailures: this._nFailures })
        this._nFailures = 0
      }
    } else if (this._nFailures++ === 0) {
      log.warn('failed to forward records to syslog, next failures will not be reported until it recovers', {
        error,
      })
    }
  }
}
