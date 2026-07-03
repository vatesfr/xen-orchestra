import t from 'tap'

import { Xapi } from './index.mjs'
import XapiError from './_XapiError.mjs'

// Build a client without starting the event loop or opening any connection.
// The failover methods under test only rely on `_sessionOpen`/`_probeHost`,
// which the tests stub, so no XAPI is contacted.
const MASTER = '192.168.1.1'
const makeXapi = opts =>
  new Xapi({
    url: `https://user:password@${MASTER}`,
    watchEvents: false,
    ...opts,
  })

// A transport-level failure (no XAPI answered), as opposed to a XapiError.
const connError = code => Object.assign(new Error(code), { code })

t.test('candidateHostnames', t => {
  t.test('is seeded with the configured target', t => {
    t.same(makeXapi().candidateHostnames, [MASTER])
    t.end()
  })

  t.test('includes the addresses passed through opts', t => {
    const xapi = makeXapi({ candidateHostnames: ['192.168.1.2', '192.168.1.3'] })
    t.same(new Set(xapi.candidateHostnames), new Set([MASTER, '192.168.1.2', '192.168.1.3']))
    t.end()
  })

  t.test('_registerCandidateHostnames dedups and ignores non-string/empty values', t => {
    const xapi = makeXapi()
    xapi._registerCandidateHostnames(['192.168.1.2', MASTER, '', null, undefined, 42])
    t.same(new Set(xapi.candidateHostnames), new Set([MASTER, '192.168.1.2']))
    t.end()
  })

  t.test('_refreshCandidateHostnames prunes an ejected-but-alive host', t => {
    // Seeded with a member that is then ejected from the pool. An ejected host
    // typically stays powered on as its own standalone master with the same
    // credentials, so it would answer a failover probe and silently connect us
    // to the wrong pool — it must not linger in the candidate set once the live
    // membership no longer lists it.
    const ejected = '192.168.1.2'
    const xapi = makeXapi({ candidateHostnames: [ejected] })
    t.ok(xapi.candidateHostnames.includes(ejected), 'ejected host starts in the set')

    // current membership reported by host.get_all_records after the eject
    xapi._refreshCandidateHostnames([MASTER, '192.168.1.3'])

    t.same(new Set(xapi.candidateHostnames), new Set([MASTER, '192.168.1.3']))
    t.notOk(xapi.candidateHostnames.includes(ejected), 'ejected host was pruned')
    t.end()
  })

  t.test('_refreshCandidateHostnames preserves the current target even when not reported', t => {
    // `host.address` can differ from the address XO used to reach the host
    // (FQDN, management IP, NAT…), so the connected target must survive a
    // refresh that does not list it.
    const xapi = makeXapi()
    xapi._refreshCandidateHostnames(['192.168.1.3'])
    t.same(new Set(xapi.candidateHostnames), new Set([MASTER, '192.168.1.3']))
    t.end()
  })

  t.test('brackets bare IPv6 addresses so they are usable as URL hostnames', t => {
    // `host.address` is a bare IPv6 (no brackets), but URL hostnames require
    // brackets.
    const xapi = makeXapi()
    xapi._registerCandidateHostnames(['fe80::1', '192.168.1.3'])
    t.ok(xapi.candidateHostnames.includes('[fe80::1]'), 'bare IPv6 is bracketed')
    t.ok(xapi.candidateHostnames.includes('192.168.1.3'), 'IPv4 is left untouched')
    t.end()
  })

  t.end()
})

t.test('_probeHost', t => {
  // A resolved/rejected transport stub: `login` drives the login result,
  // `onLogout` observes the fire-and-forget logout.
  const stubTransport = (xapi, { login, onLogout = () => {} } = {}) => {
    xapi._createTransport = ({ url }) => {
      xapi._probedUrlHostname = url.hostname
      return (method, args) => {
        if (method === 'session.login_with_password') {
          return login ?? Promise.resolve('probe-session')
        }
        if (method === 'session.logout') {
          onLogout(args[0])
          return Promise.resolve()
        }
      }
    }
  }

  t.test('rejects when the connection is sessionId-based (no credentials to reuse)', async t => {
    const xapi = makeXapi()
    xapi._auth = { sessionId: 'opaque' } // no user/password
    xapi._createTransport = () => t.fail('should not open a transport without credentials')
    await t.rejects(xapi._probeHost('192.168.1.2'), /credentials/)
  })

  t.test('brackets a bare IPv6 candidate for the probe URL and return value', async t => {
    const xapi = makeXapi()
    stubTransport(xapi)
    const target = await xapi._probeHost('fe80::1')
    t.equal(xapi._probedUrlHostname, '[fe80::1]', 'IPv6 hostname is bracketed in the URL')
    t.equal(target, '[fe80::1]', 'returns the bracketed hostname')
  })

  t.test('follows HOST_IS_SLAVE to the (bracketed) master', async t => {
    const xapi = makeXapi()
    stubTransport(xapi, {
      login: Promise.reject(Object.assign(new Error('HOST_IS_SLAVE'), { code: 'HOST_IS_SLAVE', params: ['fe80::2'] })),
    })
    const target = await xapi._probeHost('192.168.1.2')
    t.equal(target, '[fe80::2]', 'redirected to the bracketed master address')
  })

  t.test('logs the probe session out once the host answers', async t => {
    const xapi = makeXapi()
    let loggedOut
    stubTransport(xapi, { onLogout: sessionId => (loggedOut = sessionId) })
    await xapi._probeHost('192.168.1.2')
    await new Promise(resolve => setImmediate(resolve)) // let the fire-and-forget logout run
    t.equal(loggedOut, 'probe-session', 'logged the probe session out')
  })

  t.end()
})

t.test('_sessionOpenWithFailover', t => {
  t.test('does not probe when the current target answers', async t => {
    const xapi = makeXapi({ candidateHostnames: ['192.168.1.2'] })
    let opens = 0
    xapi._sessionOpen = async () => {
      opens++
    }
    xapi._probeHost = async () => t.fail('should not probe when the target answers')

    await xapi._sessionOpenWithFailover()
    t.equal(opens, 1)
    t.equal(xapi._url.hostname, MASTER, 'target is unchanged')
  })

  t.test('fails over to a surviving member when the target is unreachable', async t => {
    const xapi = makeXapi({ candidateHostnames: ['192.168.1.2'] })
    let opens = 0
    xapi._sessionOpen = async () => {
      // first open is against the dead master, the retry against the survivor
      if (++opens === 1) {
        throw connError('ECONNRESET')
      }
    }
    xapi._probeHost = async hostname => {
      if (hostname === '192.168.1.2') {
        return hostname
      }
      throw connError('EHOSTUNREACH')
    }

    await xapi._sessionOpenWithFailover()
    t.equal(opens, 2, 'reopened the session after failover')
    t.equal(xapi._url.hostname, '192.168.1.2', 'switched to the survivor')
  })

  t.test('does not fail over on a XapiError (e.g. bad credentials)', async t => {
    const xapi = makeXapi({ candidateHostnames: ['192.168.1.2'] })
    xapi._sessionOpen = async () => {
      throw new XapiError('SESSION_AUTHENTICATION_FAILED', [])
    }
    xapi._probeHost = async () => t.fail('should not probe on a XapiError')

    await t.rejects(xapi._sessionOpenWithFailover(), XapiError)
    t.equal(xapi._url.hostname, MASTER, 'target is unchanged')
  })

  t.test('rethrows the original error when every member is unreachable', async t => {
    const xapi = makeXapi({ candidateHostnames: ['192.168.1.2'] })
    const original = connError('ECONNRESET')
    xapi._sessionOpen = async () => {
      throw original
    }
    xapi._probeHost = async () => {
      throw connError('EHOSTUNREACH')
    }

    await t.rejects(xapi._sessionOpenWithFailover(), original, 'surfaces the original error, not the probe failures')
  })

  t.end()
})

t.test('_failoverToSurvivor', t => {
  t.test('probes every member and reopens against the one that answers', async t => {
    const xapi = makeXapi({ candidateHostnames: ['192.168.1.2'] })
    let opens = 0
    xapi._sessionOpen = async () => {
      opens++
    }
    xapi._probeHost = async hostname => {
      if (hostname === '192.168.1.2') {
        return hostname
      }
      throw connError('EHOSTUNREACH')
    }

    await xapi._failoverToSurvivor()
    t.equal(xapi._url.hostname, '192.168.1.2', 'switched to the survivor')
    t.equal(opens, 1, 'reopened the session')
  })

  t.test('keeps the current target when it is the one that recovers', async t => {
    const xapi = makeXapi({ candidateHostnames: ['192.168.1.2'] })
    let opens = 0
    xapi._sessionOpen = async () => {
      opens++
    }
    xapi._probeHost = async hostname => {
      if (hostname === MASTER) {
        return hostname
      }
      throw connError('EHOSTUNREACH')
    }

    await xapi._failoverToSurvivor()
    t.equal(xapi._url.hostname, MASTER, 'target is unchanged')
    t.equal(opens, 1, 'reopened the session')
  })

  t.test('throws without reopening when no member answers', async t => {
    const xapi = makeXapi({ candidateHostnames: ['192.168.1.2'] })
    let opens = 0
    xapi._sessionOpen = async () => {
      opens++
    }
    xapi._probeHost = async () => {
      throw connError('EHOSTUNREACH')
    }

    await t.rejects(xapi._failoverToSurvivor())
    t.equal(opens, 0, 'did not try to reopen a session')
  })

  t.end()
})
