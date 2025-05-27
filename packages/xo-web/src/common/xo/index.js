import authenticator from '../otp-authenticator.js'
import asap from 'asap'
import cookies from 'js-cookie'
import copy from 'copy-to-clipboard'
import fpSortBy from 'lodash/fp/sortBy'
import React from 'react'
import semver from 'semver'
import updater from 'xoa-updater'
import URL from 'url-parse'
import Xo from 'xo-lib'
import { createBackoff } from 'jsonrpc-websocket-client'
import { get as getDefined } from '@xen-orchestra/defined'
import { pFinally, reflect, retry, tap, tapCatch } from 'promise-toolbox'
import { SelectHost } from 'select-objects'
import { filter, forEach, get, includes, isEmpty, isEqual, map, once, size, sortBy, throttle } from 'lodash'
import {
  forbiddenOperation,
  incorrectState,
  noHostsAvailable,
  operationBlocked,
  operationFailed,
  vmBadPowerState,
  vmLacksFeature,
} from 'xo-common/api-errors'

import _ from '../intl'
import ActionButton from '../action-button'
import fetch, { post } from '../fetch'
import invoke from '../invoke'
import Icon from '../icon'
import logError from '../log-error'
import NewAuthTokenModal from './new-auth-token-modal'
import RegisterProxyModal from './register-proxy-modal'
import renderXoItem, { Host, renderXoItemFromId, Vm } from '../render-xo-item'
import store from 'store'
import WarmMigrationModal from './warm-migration-modal'
import { alert, chooseAction, confirm, form } from '../modal'
import { error, info, success } from '../notification'
import { getObject, isAdmin } from 'selectors'
import { getXoaPlan, SOURCES } from '../xoa-plans'
import { noop, resolveId, resolveIds } from '../utils'
import {
  connected,
  disconnected,
  markObjectsFetched,
  signedIn,
  signedOut,
  updateObjects,
  updatePermissions,
} from '../store/actions'

import parseNdJson from './_parseNdJson'
import RollingPoolRebootModal from './rolling-pool-reboot-modal'

import { NetworkCard } from '../../xo-app/xostor/new-xostor-form.js'

// ===================================================================

const MAX_VMS = 30

// ===================================================================

export const EXPIRES_SOON_DELAY = 30 * 24 * 60 * 60 * 1000 // 1 month

// ===================================================================

export const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100]
export const VDIS_TO_COALESCE_LIMIT = 10

// ===================================================================

export const XEN_DEFAULT_CPU_WEIGHT = 256
export const XEN_DEFAULT_CPU_CAP = 0

// ===================================================================

export const XEN_VIDEORAM_VALUES = [1, 2, 4, 8, 16]

// ===================================================================

export const isSrIso = sr => sr && sr.content_type === 'iso' && sr.size > 0
export const isSrWritable = sr => sr && sr.content_type !== 'iso' && sr.size > 0
export const isSrWritableOrIso = sr => sr && sr.size > 0
export const isSrShared = sr => sr && sr.shared
export const isVmRunning = vm => vm && vm.power_state === 'Running'

// ===================================================================

const reload = () => {
  // prevent automatic reconnection
  xo.removeListener('closed', connect)

  window.location.reload(true)
}

export const signOut = () => {
  cookies.remove('token')

  reload()
}

export const connect = () => {
  xo.open(createBackoff()).catch(error => {
    logError(error, 'failed to connect to xo-server')
  })
}

const xo = invoke(() => {
  const token = cookies.get('token')
  if (!token) {
    reload()
    throw new Error('no valid token')
  }

  const xo = new Xo({
    credentials: { token },
  })

  xo.on('authenticationFailure', error => {
    console.warn('authenticationFailure', error)

    if (error.name !== 'ConnectionError') {
      signOut(error)
    }
  })
  xo.on('scheduledAttempt', ({ delay }) => {
    console.warn('next attempt in %s ms', delay)
  })

  xo.on('closed', connect)

  return xo
})
connect()

const _signIn = new Promise(resolve => xo.once('authenticated', resolve))

// eslint-disable-next-line n/no-unsupported-features/node-builtins
const _call = new URLSearchParams(window.location.search.slice(1)).has('debug')
  ? async (method, params) => {
      await _signIn
      const now = Date.now()
      return tap.call(
        xo.call(method, params),
        result => {
          // eslint-disable-next-line no-console, n/no-unsupported-features/node-builtins
          console.debug('API call (%d ms)', Date.now() - now, method, params, result)
        },
        error => {
          console.error('API call (%d ms) error', Date.now() - now, method, params, error)
        }
      )
    }
  : (method, params) => _signIn.then(() => xo.call(method, params))

// ===================================================================

export const connectStore = store => {
  let updates = {}
  const sendUpdates = throttle(() => {
    store.dispatch(updateObjects(updates))
    updates = {}
  }, 5e2)

  xo.on('open', () => store.dispatch(connected()))
  xo.on('closed', () => {
    store.dispatch(signedOut())
    store.dispatch(disconnected())
  })
  xo.on('authenticated', () => {
    store.dispatch(signedIn(xo.user))

    _call('xo.getAllObjects', { ndjson: true })
      .then(({ $getFrom }) => fetch('.' + $getFrom))
      .then(response => response.text())
      .then(data => {
        const objects = Object.create(null)
        parseNdJson(data, object => {
          objects[object.id] = object
        })
        store.dispatch(updateObjects(objects))
        store.dispatch(markObjectsFetched())
      })
  })
  xo.on('notification', notification => {
    if (notification.method !== 'all') {
      return
    }

    Object.assign(updates, notification.params.items)
    sendUpdates()
  })
  subscribePermissions(permissions => store.dispatch(updatePermissions(permissions)))

  // work around to keep the user in Redux store up to date
  //
  // FIXME: store subscriptions data directly in Redux
  subscribeCurrentUser(user => {
    store.dispatch(signedIn(user))
  })
}

// -------------------------------------------------------------------

export const resolveUrl = invoke(
  xo._url, // FIXME: accessing private prop
  baseUrl => to => new URL(to, baseUrl).toString()
)

// -------------------------------------------------------------------
// Default subscription 5s
const createSubscription = (cb, { polling = 5e3 } = {}) => {
  const delay = polling
  const clearCacheDelay = 6e5 // 10m

  // contains active and lazy subscribers
  const subscribers = Object.create(null)
  const hasSubscribers = () => Object.keys(subscribers).length !== 0

  // only counts active subscribers
  let nActiveSubscribers = 0

  let cache
  let nextId = 0
  let timeout

  let running = false

  const clearCache = () => {
    cache = undefined
  }

  const uninstall = () => {
    clearTimeout(timeout)
    timeout = setTimeout(clearCache, clearCacheDelay)
  }

  // will loop if n > 0 at the end
  //
  // will not do anything if already running
  const run = () => {
    clearTimeout(timeout)

    if (running) {
      return
    }

    running = true
    _signIn
      .then(() => cb(cache))
      .then(
        result => {
          running = false

          if (nActiveSubscribers === 0) {
            return uninstall()
          }

          timeout = setTimeout(run, delay)

          if (!isEqual(result, cache)) {
            cache = result

            forEach(subscribers, subscriber => {
              // A subscriber might have disappeared during iteration.
              //
              // E.g.: if a subscriber triggers the subscription of another.
              if (subscriber) {
                subscriber(result)
              }
            })
          }
        },
        error => {
          running = false

          if (nActiveSubscribers === 0) {
            return uninstall()
          }

          console.error(error)
        }
      )
  }

  const subscribe = cb => {
    const id = nextId++
    subscribers[id] = cb

    if (cache !== undefined) {
      asap(() => cb(cache))
    }

    if (nActiveSubscribers++ === 0) {
      run()
    }

    return once(() => {
      delete subscribers[id]

      if (--nActiveSubscribers === 0) {
        uninstall()
      }
    })
  }

  subscribe.forceRefresh = () => {
    if (hasSubscribers()) {
      run()
    }
  }

  subscribe.lazy = cb => {
    const id = nextId++
    subscribers[id] = cb

    if (cache !== undefined) {
      asap(() => cb(cache))
    }

    // trigger an initial run if necessary
    if (nActiveSubscribers === 0) {
      run()
    }

    return once(() => {
      delete subscribers[id]

      // schedule cache deletion if necessary
      if (nActiveSubscribers === 0) {
        uninstall()
      }
    })
  }

  return subscribe
}

// Subscriptions -----------------------------------------------------

export const subscribeCurrentUser = createSubscription(() => xo.refreshUser())

export const subscribeAcls = createSubscription(() => _call('acl.get'))

export const subscribeHvSupportedVersions = createSubscription(
  async () => {
    try {
      return await _call('xoa.getHVSupportedVersions')
    } catch (error) {
      console.error(error)
    }
  },
  { polling: 1e3 * 60 * 60 } // 1h
)

export const subscribeJobs = createSubscription(() => _call('job.getAll'))

export const subscribeJobsLogs = createSubscription(() => _call('log.get', { namespace: 'jobs' }))

export const subscribeApiLogs = createSubscription(() => _call('log.get', { namespace: 'api' }))

export const subscribePermissions = createSubscription(() => _call('acl.getCurrentPermissions'))

export const subscribePlugins = createSubscription(() => _call('plugin.get'))

export const subscribeRemotes = createSubscription(() => _call('remote.getAll'))

export const subscribeRemotesInfo = createSubscription(() => _call('remote.getAllInfo'))

export const subscribeProxies = createSubscription(() => {
  const _isAdmin = isAdmin(store.getState())

  return _isAdmin ? _call('proxy.getAll') : undefined
})

export const subscribeResourceSets = createSubscription(() => _call('resourceSet.getAll'))

export const subscribeSchedules = createSubscription(() => _call('schedule.getAll'))

export const subscribeServers = createSubscription(
  invoke(fpSortBy('host'), sort => () => _call('server.getAll').then(sort))
)

export const subscribeConfiguredTags = createSubscription(() => _call('tag.getAllConfigured'))

export const subscribeUsers = createSubscription(() =>
  _call('user.getAll').then(users => {
    forEach(users, user => {
      user.type = 'user'
    })

    return sortBy(users, 'email')
  })
)

export const subscribeGroups = createSubscription(() =>
  _call('group.getAll').then(groups => {
    forEach(groups, group => {
      group.type = 'group'
    })

    return sortBy(groups, 'name')
  })
)

export const subscribeRoles = createSubscription(invoke(sortBy('name'), sort => () => _call('role.getAll').then(sort)))

export const subscribeIpPools = createSubscription(() => _call('ipPool.getAll'))

export const subscribeResourceCatalog = createSubscription(() => _call('cloud.getResourceCatalog'))

export const subscribeHubResourceCatalog = createSubscription(() =>
  _call('cloud.getResourceCatalog', { filters: { hub: true } })
)

const getNotificationCookie = () => {
  const notificationCookie = cookies.get(`notifications:${store.getState().user.id}`)
  return notificationCookie === undefined ? {} : JSON.parse(notificationCookie)
}

const setNotificationCookie = (id, changes) => {
  const notifications = getNotificationCookie()
  notifications[id] = { ...(notifications[id] || {}), ...changes }
  forEach(notifications[id], (value, key) => {
    if (value === null) {
      delete notifications[id][key]
    }
  })
  cookies.set(`notifications:${store.getState().user.id}`, JSON.stringify(notifications), { expires: 9999 })
}

export const dismissNotification = id => {
  setNotificationCookie(id, { read: true, date: Date.now() })
  subscribeNotifications.forceRefresh()
}

export const subscribeNotifications = createSubscription(async () => {
  const { user, xoaUpdaterState } = store.getState()
  if (+process.env.XOA_PLAN === 5 || xoaUpdaterState === 'disconnected' || xoaUpdaterState === 'error') {
    return []
  }

  let notifications
  try {
    const now = Date.now()
    notifications = (await updater._call('getMessages')).filter(({ expires }) => expires == null || expires > now)
  } catch (err) {
    return []
  }
  const notificationCookie = getNotificationCookie()
  return map(
    user != null && user.permission === 'admin' ? notifications : filter(notifications, { level: 'warning' }),
    notification => ({
      ...notification,
      read: !!get(notificationCookie, `${notification.id}.read`),
    })
  )
})

const checkSchedulerGranularitySubscriptions = {}
export const subscribeSchedulerGranularity = (host, cb) => {
  if (checkSchedulerGranularitySubscriptions[host] === undefined) {
    checkSchedulerGranularitySubscriptions[host] = createSubscription(() =>
      _call('host.getSchedulerGranularity', { host })
    )
  }

  return checkSchedulerGranularitySubscriptions[host](cb)
}
subscribeSchedulerGranularity.forceRefresh = host => {
  if (host === undefined) {
    forEach(checkSchedulerGranularitySubscriptions, subscription => subscription.forceRefresh())
    return
  }

  const subscription = checkSchedulerGranularitySubscriptions[host]
  if (subscription !== undefined) {
    subscription.forceRefresh()
  }
}

const checkSrCurrentStateSubscriptions = {}
export const subscribeCheckSrCurrentState = (pool, cb) => {
  const poolId = resolveId(pool)

  if (!checkSrCurrentStateSubscriptions[poolId]) {
    checkSrCurrentStateSubscriptions[poolId] = createSubscription(() => _call('xosan.checkSrCurrentState', { poolId }))
  }

  return checkSrCurrentStateSubscriptions[poolId](cb)
}
subscribeCheckSrCurrentState.forceRefresh = pool => {
  if (pool === undefined) {
    forEach(checkSrCurrentStateSubscriptions, subscription => subscription.forceRefresh())
    return
  }

  const subscription = checkSrCurrentStateSubscriptions[resolveId(pool)]
  if (subscription !== undefined) {
    subscription.forceRefresh()
  }
}

const missingPatchesByHost = {}
export const subscribeHostMissingPatches = (host, cb) => {
  const hostId = resolveId(host)

  if (missingPatchesByHost[hostId] == null) {
    missingPatchesByHost[hostId] = createSubscription(() => getHostMissingPatches(host))
  }

  return missingPatchesByHost[hostId](cb)
}
subscribeHostMissingPatches.forceRefresh = host => {
  if (host === undefined) {
    forEach(missingPatchesByHost, subscription => subscription.forceRefresh())
    return
  }

  const subscription = missingPatchesByHost[resolveId(host)]
  if (subscription !== undefined) {
    subscription.forceRefresh()
  }
}

const proxiesApplianceUpdaterState = {}
export const subscribeProxyApplianceUpdaterState = (proxyId, cb) => {
  if (proxiesApplianceUpdaterState[proxyId] === undefined) {
    proxiesApplianceUpdaterState[proxyId] = createSubscription(async () => {
      try {
        return await getProxyApplianceUpdaterState(proxyId)
      } catch (error) {
        console.error(error)
        return { state: 'error' }
      }
    })
  }
  return proxiesApplianceUpdaterState[proxyId](cb)
}
subscribeProxyApplianceUpdaterState.forceRefresh = proxyId => {
  if (proxyId === undefined) {
    forEach(proxiesApplianceUpdaterState, subscription => subscription.forceRefresh())
    return
  }

  const subscription = proxiesApplianceUpdaterState[proxyId]
  if (subscription !== undefined) {
    subscription.forceRefresh()
  }
}

const volumeInfoBySr = {}
export const subscribeVolumeInfo = ({ sr, infoType }, cb) => {
  sr = resolveId(sr)

  if (volumeInfoBySr[sr] == null) {
    volumeInfoBySr[sr] = {}
  }

  if (volumeInfoBySr[sr][infoType] == null) {
    volumeInfoBySr[sr][infoType] = createSubscription(() => _call('xosan.getVolumeInfo', { sr, infoType }))
  }

  return volumeInfoBySr[sr][infoType](cb)
}
subscribeVolumeInfo.forceRefresh = (() => {
  const refreshSrVolumeInfo = volumeInfo => {
    forEach(volumeInfo, subscription => subscription.forceRefresh())
  }

  return sr => {
    if (sr === undefined) {
      forEach(volumeInfoBySr, refreshSrVolumeInfo)
    } else {
      refreshSrVolumeInfo(volumeInfoBySr[sr])
    }
  }
})()

export const subscribeSrsUnhealthyVdiChainsLength = createSubscription(() => {
  const _isAdmin = isAdmin(store.getState())

  return _isAdmin ? _call('sr.getAllUnhealthyVdiChainsLength') : undefined
})

const unhealthyVdiChainsLengthSubscriptionsBySr = {}
export const createSrUnhealthyVdiChainsLengthSubscription = sr => {
  sr = resolveId(sr)
  let subscription = unhealthyVdiChainsLengthSubscriptionsBySr[sr]
  if (subscription === undefined) {
    subscription = createSubscription(() => _call('sr.getVdiChainsInfo', { sr }))
    unhealthyVdiChainsLengthSubscriptionsBySr[sr] = subscription
  }
  return subscription
}

export const subscribeUserAuthTokens = createSubscription(() => _call('user.getAuthenticationTokens'))

export const subscribeXoTasks = (() => {
  let abortController
  const cache = new Map()
  const subscribers = new Set()

  const basePath =
    './rest/v0/tasks?fields=abortionRequestedAt,end,id,name,objectId,properties,start,status,updatedAt,href'

  const clearCacheDelay = 6e5 // 10m
  let clearCacheTimeout
  function clearCache() {
    cache.clear()
  }

  const notify = throttle(function () {
    // The object needs to be different each time to ensure components refresh
    const data = Array.from(cache.values())

    for (const subscriber of subscribers) {
      subscriber(data)
    }
  }, 100)

  async function run() {
    if (abortController !== undefined) {
      return
    }
    abortController = new AbortController()
    clearTimeout(clearCacheTimeout)

    while (true) {
      try {
        // starts watching collection
        const resWatch = await fetch(basePath + '&ndjson&watch', { signal: abortController.signal })

        // fetches existing objects
        const response = await fetch(basePath, { signal: abortController.signal })
        const objects = await response.json()
        cache.clear()
        for (const object of objects) {
          cache.set(object.id, object)
        }
        notify()

        // handles events
        let buf = ''
        for await (const chunk of resWatch.body) {
          buf += String.fromCharCode(...chunk)

          let i
          while ((i = buf.indexOf('\n')) !== -1) {
            const line = buf.slice(0, i)
            buf = buf.slice(i + 1)
            const [event, object] = JSON.parse(line)
            if (event === 'remove') {
              cache.delete(object.id)
            } else {
              cache.set(object.id, object)
            }
          }
          notify()
        }
      } catch (error) {
        if (error === 'abort') {
          break
        }

        console.error('monitor XO tasks', error)
      }

      await new Promise(resolve => setTimeout(resolve, 10e3))
    }

    abortController = undefined
    clearCacheTimeout = setTimeout(clearCache, clearCacheDelay)
  }

  return function subscribeXoTasks(cb) {
    subscribers.add(cb)

    asap(() => cb(cache))

    run()

    return once(function unsubscribeXoTasks() {
      subscribers.delete(cb)
      if (subscribers.size === 0) {
        abortController.abort('abort')
      }
    })
  }
})()

export const subscribeCloudXoConfigBackups = createSubscription(
  () => fetch('./rest/v0/cloud/xo-config/backups?fields=xoaId,createdAt,id,content_href').then(resp => resp.json()),
  { polling: 6e4 }
)

export const subscribeCloudXoConfig = createSubscription(() =>
  fetch('./rest/v0/cloud/xo-config').then(resp => resp.json())
)

const subscribeSrsXostorHealthCheck = {}
export const subscribeXostorHealthCheck = sr => {
  const srId = resolveId(sr)

  if (subscribeSrsXostorHealthCheck[srId] === undefined) {
    subscribeSrsXostorHealthCheck[srId] = createSubscription(() => _call('xostor.healthCheck', { sr: srId }), {
      polling: 6e4, // To avoid spamming the linstor controller
    })
  }

  return subscribeSrsXostorHealthCheck[srId]
}

const subscribeSrsXostorInterfaces = {}
export const subscribeXostorInterfaces = sr => {
  const srId = resolveId(sr)

  if (subscribeSrsXostorInterfaces[srId] === undefined) {
    subscribeSrsXostorInterfaces[srId] = createSubscription(() => _call('xostor.getInterfaces', { sr: srId }), {
      polling: 6e4, // To avoid spamming the linstor controller
    })
  }

  return subscribeSrsXostorInterfaces[srId]
}
subscribeXostorInterfaces.forceRefresh = sr => {
  if (sr === undefined) {
    forEach(subscribeSrsXostorInterfaces, subscription => subscription.forceRefresh())
    return
  }

  const subscription = subscribeSrsXostorInterfaces[resolveId(sr)]
  subscription?.forceRefresh()
}

const subscribeHostsIpmiSensors = {}
export const subscribeIpmiSensors = host => {
  const _isAdmin = isAdmin(store.getState())
  const hostId = resolveId(host)

  if (subscribeHostsIpmiSensors[hostId] === undefined) {
    subscribeHostsIpmiSensors[hostId] = createSubscription(
      async () =>
        _isAdmin
          ? await _call('host.getIpmiSensors', {
              id: hostId,
            })
          : undefined,
      {
        polling: 6e4,
      }
    )
  }

  return subscribeHostsIpmiSensors[hostId]
}

const subscribeHostsMdadmHealth = {}
export const subscribeMdadmHealth = host => {
  const hostId = resolveId(host)

  if (subscribeHostsMdadmHealth[hostId] === undefined) {
    subscribeHostsMdadmHealth[hostId] = createSubscription(() => _call('host.getMdadmHealth', { id: hostId }))
  }

  return subscribeHostsMdadmHealth[hostId]
}

export const getHostBiosInfo = host => _call('host.getBiosInfo', { id: resolveId(host) })

const subscribeVmSecurebootReadiness = {}
export const subscribeSecurebootReadiness = id => {
  const vmId = resolveId(id)

  if (subscribeVmSecurebootReadiness[vmId] === undefined) {
    let forceRefresh = false
    const subscription = createSubscription(
      async () => {
        try {
          return await _call('vm.getSecurebootReadiness', { id: vmId, forceRefresh })
        } catch (error) {
          if (error.data?.code !== 'MESSAGE_METHOD_UNKNOWN') {
            throw error
          }
        }
      },
      {
        polling: 3e4,
      }
    )
    const forceRefreshFn = subscription.forceRefresh
    subscription.forceRefresh = async () => {
      const _forceRefresh = forceRefresh
      forceRefresh = true
      await forceRefreshFn()
      forceRefresh = _forceRefresh
    }
    subscribeVmSecurebootReadiness[vmId] = subscription
  }
  return subscribeVmSecurebootReadiness[vmId]
}
subscribeSecurebootReadiness.forceRefresh = vm => {
  if (vm === undefined) {
    forEach(subscribeVmSecurebootReadiness, subscription => subscription.forceRefresh())
    return
  }

  const subscription = subscribeVmSecurebootReadiness[resolveId(vm)]
  subscription?.forceRefresh()
}

const subscribePoolGuestSecurebootReadiness = {}
export const subscribeGetGuestSecurebootReadiness = pool => {
  const poolId = resolveId(pool)

  if (subscribePoolGuestSecurebootReadiness[poolId] === undefined) {
    subscribePoolGuestSecurebootReadiness[poolId] = createSubscription(
      async () => {
        try {
          return await _call('pool.getGuestSecureBootReadiness', { id: poolId })
        } catch (error) {
          if (error.data?.code !== 'MESSAGE_METHOD_UNKNOWN') {
            throw error
          }
        }
      },
      {
        polling: 3e4,
      }
    )
  }

  return subscribePoolGuestSecurebootReadiness[poolId]
}
subscribePoolGuestSecurebootReadiness.forceRefresh = pool => {
  if (pool === undefined) {
    forEach(subscribePoolGuestSecurebootReadiness, subscription => subscription.forceRefresh())
    return
  }

  const subscription = subscribePoolGuestSecurebootReadiness[resolveId(pool)]
  subscription?.forceRefresh()
}

// System ============================================================

export const apiMethods = _call('system.getMethodsInfo')

export const serverVersion = _call('system.getServerVersion')

export const getXoServerTimezone = _call('system.getServerTimezone')

// XO --------------------------------------------------------------------------

import ImportConfigModal from './import-config-modal' // eslint-disable-line import/first
export const importConfig = config =>
  confirm({
    title: _('importConfig'),
    body: <ImportConfigModal />,
    icon: 'import',
  }).then(
    passphrase =>
      _call('xo.importConfig', { passphrase }).then(({ $sendTo }) =>
        post($sendTo, config).then(response => {
          if (response.status !== 200) {
            throw new Error('config import failed')
          }
        })
      ),
    () => false
  )

import ExportConfigModal from './export-config-modal' // eslint-disable-line import/first
export const exportConfig = () =>
  confirm({
    title: _('exportConfig'),
    body: <ExportConfigModal />,
    icon: 'export',
  }).then(
    passphrase =>
      _call('xo.exportConfig', { passphrase }).then(({ $getFrom: url }) => {
        window.open(`.${url}`)
      }),
    noop
  )

// Server ------------------------------------------------------------

export const addServer = (host, username, password, label, allowUnauthorized, httpProxy) =>
  _call('server.add', {
    allowUnauthorized,
    host,
    httpProxy: httpProxy || undefined,
    label: label || undefined,
    password,
    username,
  })::tap(subscribeServers.forceRefresh, () => error(_('serverError'), _('serverAddFailed')))

export const editServer = (server, props) =>
  _call('server.set', { ...props, id: resolveId(server) })::tap(subscribeServers.forceRefresh)

export const enableServer = server =>
  _call('server.enable', { id: resolveId(server) })
    ::tapCatch(err => {
      if (err.message === 'Invalid XML-RPC message') {
        error(_('enableServerErrorTitle'), _('enableServerErrorMessage'))
      }
    })
    ::pFinally(subscribeServers.forceRefresh)

export const disableServer = server =>
  _call('server.disable', { id: resolveId(server) })::tap(subscribeServers.forceRefresh)

export const removeServer = server =>
  _call('server.remove', { id: resolveId(server) })::tap(subscribeServers.forceRefresh)

// Pool --------------------------------------------------------------

export const editPool = (pool, props) => _call('pool.set', { id: resolveId(pool), ...props })

export const getPatchesDifference = (source, target) =>
  _call('pool.getPatchesDifference', {
    source: resolveId(source),
    target: resolveId(target),
  })

export const addHostToPool = (pool, host) => {
  if (host) {
    return confirm({
      icon: 'add',
      title: _('addHostModalTitle'),
      body: _('addHostModalMessage', {
        pool: pool.name_label,
        host: host.name_label,
      }),
    }).then(() =>
      _call('pool.mergeInto', {
        source: host.$pool,
        target: pool.id,
        force: true,
      })
    )
  }
}

import AddHostsModalBody from './add-hosts-modal' // eslint-disable-line import/first
export const addHostsToPool = pool =>
  confirm({
    icon: 'add',
    title: _('addHostsLabel'),
    body: <AddHostsModalBody pool={pool} />,
  }).then(params => {
    const { hosts } = params
    if (isEmpty(hosts)) {
      error(_('addHostNoHost'), _('addHostNoHostMessage'))
      return
    }

    return _call('pool.mergeInto', {
      sources: map(hosts, '$pool'),
      target: pool.id,
      force: true,
    }).catch(error => {
      if (error.code !== 'HOSTS_NOT_HOMOGENEOUS') {
        throw error
      }

      error(_('addHostsErrorTitle', { nHosts: hosts.length }), _('addHostNotHomogeneousErrorMessage'))
    })
  })

export const enableAdvancedLiveTelemetry = async host => {
  const isConfiguredToReceiveStreaming = await _call('netdata.isConfiguredToReceiveStreaming', { host: host.id })
  if (!isConfiguredToReceiveStreaming) {
    await _call('netdata.configureXoaToReceiveData')
  }
  await _call('netdata.configureHostToStreamHere', {
    host: host.id,
  })
  success(_('advancedLiveTelemetry'), _('enableAdvancedLiveTelemetrySuccess'))
}

export const isNetDataInstalledOnHost = async host => {
  const isNetDataInstalledOnHost = await _call('netdata.isNetDataInstalledOnHost', { host: host.id })
  if (!isNetDataInstalledOnHost) {
    return false
  }
  const [hostApiKey, localApiKey] = await Promise.all([
    _call('netdata.getHostApiKey', {
      host: host.id,
    }),
    _call('netdata.getLocalApiKey'),
  ])
  return hostApiKey === localApiKey
}

export const detachHost = host =>
  confirm({
    icon: 'host-eject',
    title: _('detachHostModalTitle'),
    body: _('detachHostModalMessage', {
      host: <strong>{host.name_label}</strong>,
    }),
  }).then(() => _call('host.detach', { host: host.id }))

export const disableHost = host =>
  confirm({
    icon: 'host-disable',
    title: _('disableHost'),
    body: _('disableHostModalMessage', {
      host: <strong>{host.name_label}</strong>,
    }),
  }).then(() => _call('host.disable', { host: resolveId(host) }))

export const forgetHost = host =>
  confirm({
    icon: 'host-forget',
    title: _('forgetHostModalTitle'),
    body: _('forgetHostModalMessage', {
      host: <strong>{host.name_label}</strong>,
    }),
  }).then(() => _call('host.forget', { host: resolveId(host) }))

export const enableHost = host => _call('host.enable', { host: resolveId(host) })

export const enableHa = ({ pool, heartbeatSrs, configuration }) =>
  _call('pool.enableHa', { pool: resolveId(pool), heartbeatSrs, configuration })

export const disableHa = pool => _call('pool.disableHa', { pool: resolveId(pool) })

export const setDefaultSr = sr => _call('pool.setDefaultSr', { sr: resolveId(sr) })

export const setPoolMaster = host =>
  confirm({
    title: _('setPoolMasterModalTitle'),
    body: _('setPoolMasterModalMessage', {
      host: <strong>{host.name_label}</strong>,
    }),
  }).then(() => _call('pool.setPoolMaster', { host: resolveId(host) }), noop)

export const rollingPoolReboot = async pool => {
  const poolId = resolveId(pool)
  await confirm({
    body: <RollingPoolRebootModal pool={poolId} />,
    title: _('rollingPoolReboot'),
    icon: 'pool-rolling-reboot',
  })
  try {
    return await _call('pool.rollingReboot', { pool: poolId })
  } catch (error) {
    if (!forbiddenOperation.is(error)) {
      throw error
    }
    await confirm({
      body: (
        <p className='text-warning'>
          <Icon icon='alarm' /> {_('bypassBackupPoolModalMessage')}
        </p>
      ),
      title: _('rollingPoolReboot'),
      icon: 'pool-rolling-reboot',
    })
    return _call('pool.rollingReboot', { pool: poolId, bypassBackupCheck: true })
  }
}

export const getPoolGuestSecureBootReadiness = async poolId => {
  try {
    return await _call('pool.getGuestSecureBootReadiness', { id: poolId })
  } catch (error) {
    if (error.data?.code !== 'MESSAGE_METHOD_UNKNOWN') {
      throw error
    }
  }
}
// Host --------------------------------------------------------------

export const setSchedulerGranularity = (host, schedulerGranularity) =>
  _call('host.setSchedulerGranularity', {
    host,
    schedulerGranularity,
  })::tap(() => subscribeSchedulerGranularity.forceRefresh(host))

export const editHost = (host, props) => _call('host.set', { ...props, id: resolveId(host) })

import MultipathingModalBody from './multipathing-modal' // eslint-disable-line import/first
export const setHostsMultipathing = ({ host, hosts = [host], multipathing }) => {
  const ids = resolveIds(hosts)
  return confirm({
    title: _(multipathing ? 'enableMultipathing' : 'disableMultipathing'),
    body: <MultipathingModalBody hostIds={ids} />,
  }).then(() => Promise.all(map(ids, id => editHost(id, { multipathing }))), noop)
}

export const fetchHostStats = (host, granularity) => _call('host.stats', { host: resolveId(host), granularity })

export const setRemoteSyslogHost = (host, syslogDestination) =>
  _call('host.setRemoteSyslogHost', {
    id: resolveId(host),
    syslogDestination,
  })

export const setRemoteSyslogHosts = (hosts, syslogDestination) =>
  Promise.all(map(hosts, host => setRemoteSyslogHost(host, syslogDestination)))

export const restartHost = async (
  host,
  force = false,
  suspendResidentVms = false,
  bypassBlockedSuspend = false,
  bypassCurrentVmCheck = false
) => {
  await confirm({
    title: _('restartHostModalTitle'),
    body: _('restartHostModalMessage'),
  })
  return _restartHost({ host, force, suspendResidentVms, bypassBlockedSuspend, bypassCurrentVmCheck })
}

const _restartHost = async ({ host, ...opts }) => {
  opts = { ...opts, id: resolveId(host) }

  try {
    await _call('host.restart', opts)
  } catch (error) {
    if (cantSuspend(error)) {
      await confirm({
        body: (
          <p>
            <Icon icon='alarm' /> {_('forceSmartRebootHost', { nVms: error.data.actual.length })}
          </p>
        ),
        title: _('restartHostModalTitle'),
      })
      return _restartHost({ ...opts, host, bypassBlockedSuspend: true })
    }

    if (xoaOnHost(error)) {
      await confirm({
        body: (
          <p>
            <Icon icon='alarm' /> {_('smartRebootBypassCurrentVmCheck')}
          </p>
        ),
        title: _('restartHostModalTitle'),
      })
      return _restartHost({ ...opts, host, bypassCurrentVmCheck: true })
    }

    if (backupIsRunning(error, host.$poolId)) {
      await confirm({
        body: (
          <p className='text-warning'>
            <Icon icon='alarm' /> {_('bypassBackupHostModalMessage')}
          </p>
        ),
        title: _('restartHostModalTitle'),
      })
      return _restartHost({ ...opts, host, bypassBackupCheck: true })
    }

    if (masterNeedsUpdate(error)) {
      const state = store.getState()
      const master = getObject(state, getObject(state, host.$pool).master)
      await chooseAction({
        body: (
          <p>
            <Icon icon='alarm' />{' '}
            {_('slaveHostMoreUpToDateThanMasterAfterRestart', { master: <Host id={master.id} link /> })}
          </p>
        ),
        buttons: [{ label: _('restartAnyway'), btnStyle: 'danger' }],
        icon: 'alarm',
        title: _('restartHostModalTitle'),
      })

      return _restartHost({ ...opts, host, bypassVersionCheck: true })
    }

    if (noHostsAvailableErrCheck(error)) {
      alert(_('noHostsAvailableErrorTitle'), _('noHostsAvailableErrorMessage'))
    }
    throw error
  }
}

// ---- Restart Host errors
const cantSuspend = err =>
  err !== undefined &&
  incorrectState.is(err, {
    object: 'suspendBlocked',
  })
const xoaOnHost = err =>
  err !== undefined &&
  operationFailed.is(err, {
    code: 'xoaOnHost',
  })
const backupIsRunning = (err, poolId) =>
  err !== undefined &&
  (forbiddenOperation.is(err, {
    reason: `A backup may run on the pool: ${poolId}`,
  }) ||
    forbiddenOperation.is(err, {
      reason: `A backup is running on the pool: ${poolId}`,
    }))
const masterNeedsUpdate = err =>
  err !== undefined &&
  incorrectState.is(err, {
    property: 'rebootRequired',
  })

const noHostsAvailableErrCheck = err => err !== undefined && noHostsAvailable.is(err)

export const restartHosts = (hosts, force = false) => {
  const nHosts = size(hosts)
  return confirm({
    title: _('restartHostsModalTitle', { nHosts }),
    body: _('restartHostsModalMessage', { nHosts }),
  }).then(
    () =>
      Promise.all(map(hosts, host => _call('host.restart', { id: resolveId(host), force })::reflect())).then(
        results => {
          const nbErrors = filter(results, result => !result.isFulfilled()).length
          if (nbErrors) {
            return alert(
              _('failHostBulkRestartTitle'),
              _('failHostBulkRestartMessage', {
                failedHosts: nbErrors,
                totalHosts: results.length,
              })
            )
          }
        }
      ),
    noop
  )
}

export const restartHostAgent = async host => {
  try {
    await _call('host.restart_agent', { id: resolveId(host) })
  } catch (error) {
    if (forbiddenOperation.is(error)) {
      await confirm({
        body: (
          <p className='text-warning'>
            <Icon icon='alarm' /> {_('bypassBackupHostModalMessage')}
          </p>
        ),
        title: _('restartHostAgent'),
      })
      return _call('host.restart_agent', { id: resolveId(host), bypassBackupCheck: true })
    }
    throw error
  }
}

export const restartHostsAgents = hosts => {
  const nHosts = size(hosts)
  return confirm({
    title: _('restartHostsAgentsModalTitle', { nHosts }),
    body: _('restartHostsAgentsModalMessage', { nHosts }),
  }).then(() => Promise.all(map(hosts, restartHostAgent)), noop)
}

export const startHost = host => _call('host.start', { id: resolveId(host) })

export const stopHost = async host => {
  await confirm({
    body: _('stopHostModalMessage'),
    title: _('stopHostModalTitle'),
  })

  let ignoreBackup = false
  return _call('host.stop', { id: resolveId(host) })
    .catch(async err => {
      if (
        forbiddenOperation.is(err, {
          reason: `A backup may run on the pool: ${host.$poolId}`,
        }) ||
        forbiddenOperation.is(error, {
          reason: `A backup is running on the pool: ${host.$poolId}`,
        })
      ) {
        ignoreBackup = true
        await confirm({
          body: (
            <p className='text-warning'>
              <Icon icon='alarm' /> {_('bypassBackupHostModalMessage')}
            </p>
          ),
          title: _('stopHostModalTitle'),
        })
        return _call('host.stop', { id: resolveId(host), bypassBackupCheck: ignoreBackup })
      }
      throw err
    })
    .catch(async err => {
      if (noHostsAvailable.is(err)) {
        await confirm({
          body: _('forceStopHostMessage'),
          title: _('forceStopHost'),
        })
        // Retry with bypassEvacuate.
        return _call('host.stop', { id: resolveId(host), bypassEvacuate: true, bypassBackupCheck: ignoreBackup })
      }
      throw err
    })
}

export const stopHosts = hosts => {
  const nHosts = size(hosts)
  return confirm({
    title: _('stopHostsModalTitle', { nHosts }),
    body: _('stopHostsModalMessage', { nHosts }),
  }).then(() => Promise.all(map(hosts, host => _call('host.stop', { id: resolveId(host) }))), noop)
}

export const toggleMaintenanceMode = async host => {
  if (host.enabled) {
    try {
      await confirm({
        title: _('maintenanceHostModalTitle'),
        body: _('maintenanceHostModalMessage'),
      })
    } catch (error) {
      return
    }
  }
  return _call('host.setMaintenanceMode', { id: resolveId(host), maintenance: host.enabled }).catch(async err => {
    if (err.message === 'operation blocked') {
      const residentVmsIds = host.residentVms
      const vms = residentVmsIds
        .map(vmId => getObject(store.getState(), vmId))
        .filter(
          vm =>
            vm.type === 'VM' &&
            vm.power_state === 'Running' &&
            vm?.blockedOperations &&
            Object.keys(vm.blockedOperations).length > 0
        )
      const vmsToForceMigrate = vms.map(vm => vm.id)
      confirm({
        title: _('bypassBlockedMigrationsModalTitle'),
        body: _('bypassBlockedMigrationsModalMessage', {
          vms: (
            <ul>
              {vms.map(vm => (
                <li key={vm.id}>
                  <Vm id={vm.id} />
                </li>
              ))}
            </ul>
          ),
        }),
      }).then(() =>
        _call('host.setMaintenanceMode', { id: resolveId(host), maintenance: host.enabled, vmsToForceMigrate })
      )
      return
    }
    throw err
  })
}

export const getHostMissingPatches = async host => {
  const hostId = resolveId(host)
  host = getObject(store.getState(), hostId)

  if (host.power_state !== 'Running') {
    return []
  }
  if (host.productBrand !== 'XCP-ng') {
    const patches = await _call('pool.listMissingPatches', { host: hostId })
    // Hide paid patches to XS-free users
    return host.license_params.sku_type !== 'free' ? patches : filter(patches, { paid: false })
  }
  try {
    return await _call('pool.listMissingPatches', { host: hostId })
  } catch (_) {
    return null
  }
}

export const emergencyShutdownHost = host =>
  confirm({
    title: _('emergencyShutdownHostModalTitle'),
    body: _('emergencyShutdownHostModalMessage', {
      host: <strong>{host.name_label}</strong>,
    }),
  }).then(() => _call('host.emergencyShutdownHost', { host: resolveId(host) }))

export const emergencyShutdownHosts = hosts => {
  const nHosts = size(hosts)
  return confirm({
    title: _('emergencyShutdownHostsModalTitle', { nHosts }),
    body: _('emergencyShutdownHostsModalMessage', { nHosts }),
  }).then(() => Promise.all(map(hosts, host => emergencyShutdownHost(host))), noop)
}

export const isHostTimeConsistentWithXoaTime = host => {
  if (host.power_state !== 'Running') {
    return true
  }
  return _call('host.isHostServerTimeConsistent', { host: resolveId(host) })
}

export const isHyperThreadingEnabledHost = host =>
  _call('host.isHyperThreadingEnabled', {
    id: resolveId(host),
  })

export const getSmartctlHealth = host => _call('host.getSmartctlHealth', { id: resolveId(host) })

export const getSmartctlInformation = (host, deviceNames) =>
  _call('host.getSmartctlInformation', { id: resolveId(host), deviceNames })

export const installCertificateOnHost = (id, props) => _call('host.installCertificate', { id, ...props })

export const setControlDomainMemory = (id, memory) => _call('host.setControlDomainMemory', { id, memory })

export const isPubKeyTooShort = host => {
  // this check is only relevant for old hosts, and cannot be done on offline hosts
  if (host.productBrand !== 'XCP-ng' || semver.satisfies(host.version, '>=8.3.0') || host.power_state === 'Halted') {
    return Promise.resolve(false)
  }
  return _call('host.isPubKeyTooShort', { id: host.id })
}

// for XCP-ng now
export const installAllPatchesOnHost = ({ host }) =>
  confirm({
    body: _('installAllPatchesOnHostContent'),
    title: _('installAllPatchesTitle'),
  }).then(() =>
    _call('pool.installPatches', { hosts: [resolveId(host)] })::tap(() =>
      subscribeHostMissingPatches.forceRefresh(host)
    )
  )

export const installPatches = (patches, pool) =>
  confirm({
    body: _('installPatchesContent', { nPatches: patches.length }),
    title: _('installPatchesTitle', { nPatches: patches.length }),
  }).then(() =>
    _call('pool.installPatches', {
      pool: resolveId(pool),
      patches: resolveIds(patches),
    })::tap(() => subscribeHostMissingPatches.forceRefresh())
  )

import InstallPoolPatchesModalBody from './install-pool-patches-modal' // eslint-disable-line import/first
export const installAllPatchesOnPool = ({ pool }) => {
  const poolId = resolveId(pool)
  return confirm({
    body: <InstallPoolPatchesModalBody pool={poolId} />,
    title: _('installPoolPatches'),
    icon: 'host-patch-update',
  }).then(
    () => _call('pool.installPatches', { pool: poolId })::tap(() => subscribeHostMissingPatches.forceRefresh()),
    noop
  )
}

import RollingPoolUpdateModal from './rolling-pool-updates-modal' // eslint-disable-line import/first
export const rollingPoolUpdate = async poolId => {
  await confirm({
    body: <RollingPoolUpdateModal pool={poolId} />,
    title: _('rollingPoolUpdate'),
    icon: 'pool-rolling-update',
  })

  const rpu = async ({ bypassBackupCheck = false, rebootVm = false } = {}) => {
    try {
      await _call('pool.rollingUpdate', { pool: poolId, bypassBackupCheck, rebootVm })
      subscribeHostMissingPatches.forceRefresh()
    } catch (err) {
      if (forbiddenOperation.is(err)) {
        await confirm({
          body: (
            <p className='text-warning'>
              <Icon icon='alarm' /> {_('bypassBackupPoolModalMessage')}
            </p>
          ),
          title: _('rollingPoolUpdate'),
          icon: 'pool-rolling-update',
        })
        await rpu({ bypassBackupCheck: true, rebootVm })
      }
      if (incorrectState.is(err, { property: 'guidance' })) {
        await confirm({
          body: (
            <p className='text-warning'>
              <Icon icon='alarm' /> {_('rpuRequireVmsReboot')}
            </p>
          ),
          title: _('rollingPoolUpdate'),
          icon: 'pool-rolling-update',
        })
        await rpu({ bypassBackupCheck, rebootVm: true })
      }
    }
  }

  await rpu()
}

export const installSupplementalPack = (host, file) => {
  info(_('supplementalPackInstallStartedTitle'), _('supplementalPackInstallStartedMessage'))

  return _call('host.installSupplementalPack', { host: resolveId(host) }).then(({ $sendTo }) =>
    post($sendTo, file)
      .then(res => {
        if (res.status !== 200) {
          throw new Error('installing supplemental pack failed')
        }

        success(_('supplementalPackInstallSuccessTitle'), _('supplementalPackInstallSuccessMessage'))
      })
      .catch(err => {
        error(_('supplementalPackInstallErrorTitle'), _('supplementalPackInstallErrorMessage'))
        throw err
      })
  )
}

export const installSupplementalPackOnAllHosts = (pool, file) => {
  info(_('supplementalPackInstallStartedTitle'), _('supplementalPackInstallStartedMessage'))

  return _call('pool.installSupplementalPack', { pool: resolveId(pool) }).then(({ $sendTo }) =>
    post($sendTo, file)
      .then(res => {
        if (res.status !== 200) {
          throw new Error('installing supplemental pack failed')
        }

        success(_('supplementalPackInstallSuccessTitle'), _('supplementalPackInstallSuccessMessage'))
      })
      .catch(err => {
        error(_('supplementalPackInstallErrorTitle'), _('supplementalPackInstallErrorMessage'))
        throw err
      })
  )
}

export const hidePcis = async (pcis, hide) => {
  await confirm({
    body: _('applyChangeOnPcis', { nPcis: pcis.length }),
    // hide `true` means that we will disable dom0's PCI access, so we will "enable" the possibility of passthrough this PCI
    title: _(hide ? 'pcisEnable' : 'pcisDisable', { nPcis: pcis.length }),
  })
  try {
    await _call('pci.disableDom0Access', { pcis: resolveIds(pcis), disable: hide })
  } catch (error) {
    if (!noHostsAvailable.is(error)) {
      throw error
    }
    try {
      await confirm({
        body: _('hostEvacuationFailed'),
        title: _('confirmForceRebootHost'),
      })
    } catch (_) {
      throw error // throw original error if user doesn't want to force
    }
    await _call('pci.disableDom0Access', { pcis: resolveIds(pcis), disable: hide, forceReboot: true })
  }
}

export const isPciHidden = async pci => (await _call('pci.getDom0AccessStatus', { id: resolveId(pci) })) === 'disabled'

//  ATM, unknown date for the availablity on XS, since they are doing rolling release
// FIXME: When XS release methods to do PCI passthrough, update this check
export const isPciPassthroughAvailable = host =>
  host.productBrand === 'XCP-ng' && semver.satisfies(host.version, '>=8.3.0')

export const vmAttachPcis = (vm, pcis) => _call('vm.attachPcis', { id: resolveId(vm), pcis: resolveIds(pcis) })

export const vmDetachPcis = (vm, pciIds) => _call('vm.detachPcis', { id: resolveId(vm), pciIds })

export const vmSetUefiMode = (vm, mode) =>
  _call('vm.set', { id: resolveId(vm), uefiMode: mode })::tap(() => subscribeSecurebootReadiness.forceRefresh(vm))

// Containers --------------------------------------------------------

export const pauseContainer = (vm, container) => _call('docker.pause', { vm: resolveId(vm), container })

export const restartContainer = (vm, container) => _call('docker.restart', { vm: resolveId(vm), container })

export const startContainer = (vm, container) => _call('docker.start', { vm: resolveId(vm), container })

export const stopContainer = (vm, container) => _call('docker.stop', { vm: resolveId(vm), container })

export const unpauseContainer = (vm, container) => _call('docker.unpause', { vm: resolveId(vm), container })

// VM ----------------------------------------------------------------

const chooseActionToUnblockForbiddenStartVm = props =>
  chooseAction({
    icon: 'alarm',
    buttons: [
      { label: _('cloneAndStartVM'), value: 'clone', btnStyle: 'success' },
      { label: _('forceStartVm'), value: 'force', btnStyle: 'danger' },
    ],
    ...props,
  })

const cloneAndStartVm = async (vm, host) => _call('vm.start', { id: await cloneVm(vm), host: resolveId(host) })

const _startVm = (id, host, { force = false, bypassMacAddressesCheck = force } = {}) =>
  _call('vm.start', { id, bypassMacAddressesCheck, force, host })

export const startVm = async (vm, host) => {
  if (host === true) {
    host = await confirm({
      icon: 'vm-start',
      title: _('startVmOnLabel'),
      body: <SelectHost predicate={({ $pool }) => $pool === vm.$pool} />,
    })
    if (host === undefined) {
      error(_('startVmOnMissingHostTitle'), _('startVmOnMissingHostMessage'))
      return
    }
  }

  const id = resolveId(vm)
  const hostId = resolveId(host)
  return _startVm(id, hostId).catch(async reason => {
    const isDuplicatedMacAddressError = reason.data !== undefined && reason.data.code === 'DUPLICATED_MAC_ADDRESS'
    if (!isDuplicatedMacAddressError && !forbiddenOperation.is(reason)) {
      throw reason
    }

    if (isDuplicatedMacAddressError) {
      // Retry without checking MAC addresses
      await confirm({
        title: _('forceStartVm'),
        body: _('vmWithDuplicatedMacAddressesMessage'),
      })
      try {
        await _startVm(id, hostId, { bypassMacAddressesCheck: true })
      } catch (error) {
        if (!forbiddenOperation.is(error)) {
          throw error
        }
        reason = error
      }
    }

    if (forbiddenOperation.is(reason)) {
      // Clone or retry with force
      const choice = await chooseActionToUnblockForbiddenStartVm({
        body: _('blockedStartVmModalMessage'),
        title: _('forceStartVmModalTitle'),
      })

      if (choice === 'clone') {
        return cloneAndStartVm(vm, host)
      }

      return _startVm(id, hostId, { force: true })
    }
  })
}

export const startVms = vms =>
  confirm({
    title: _('startVmsModalTitle', { vms: vms.length }),
    body: _('startVmsModalMessage', { vms: vms.length }),
  }).then(async () => {
    const vmsWithduplicatedMacAddresses = []
    const forbiddenStart = []
    let nErrors = 0

    await Promise.all(
      map(vms, id =>
        _startVm(id).catch(reason => {
          if (reason.data !== undefined && reason.data.code === 'DUPLICATED_MAC_ADDRESS') {
            vmsWithduplicatedMacAddresses.push(id)
          } else if (forbiddenOperation.is(reason)) {
            forbiddenStart.push(id)
          } else {
            nErrors++
          }
        })
      )
    )

    if (forbiddenStart.length === 0 && vmsWithduplicatedMacAddresses.length === 0) {
      if (nErrors === 0) {
        return
      }

      return error(_('failedVmsErrorTitle'), _('failedVmsErrorMessage', { nVms: nErrors }))
    }

    if (vmsWithduplicatedMacAddresses.length > 0) {
      // Retry without checking MAC addresses
      await confirm({
        title: _('forceStartVm'),
        body: _('vmsWithDuplicatedMacAddressesMessage', { nVms: vmsWithduplicatedMacAddresses.length }),
      })
      await Promise.all(
        map(vmsWithduplicatedMacAddresses, id =>
          _startVm(id, undefined, { bypassMacAddressesCheck: true }).catch(reason => {
            if (forbiddenOperation.is(reason)) {
              forbiddenStart.push(id)
            } else {
              nErrors++
            }
          })
        )
      )
    }

    if (forbiddenStart.length > 0) {
      // Clone or retry with force
      const choice = await chooseActionToUnblockForbiddenStartVm({
        body: _('blockedStartVmsModalMessage', { nVms: forbiddenStart.length }),
        title: _('forceStartVmModalTitle'),
      }).catch(noop)

      if (nErrors !== 0) {
        error(_('failedVmsErrorTitle'), _('failedVmsErrorMessage', { nVms: nErrors }))
      }

      if (choice === 'clone') {
        return Promise.all(map(forbiddenStart, async id => cloneAndStartVm(getObject(store.getState(), id))))
      }

      if (choice === 'force') {
        return Promise.all(map(forbiddenStart, id => _startVm(id, undefined, { force: true })))
      }
    }
  }, noop)

export const stopVm = (vm, hardShutdown = false) => stopOrRestartVm(vm, 'stop', hardShutdown)

export const stopVms = (vms, force = false) =>
  confirm({
    title: _('stopVmsModalTitle', { vms: vms.length }),
    body: _('stopVmsModalMessage', { vms: vms.length }),
  }).then(() => Promise.all(map(vms, vm => _call('vm.stop', { id: resolveId(vm), force }))), noop)

export const suspendVm = vm => _call('vm.suspend', { id: resolveId(vm) })

export const suspendVms = vms =>
  confirm({
    title: _('suspendVmsModalTitle', { vms: vms.length }),
    body: _('suspendVmsModalMessage', { vms: vms.length }),
  }).then(() => Promise.all(map(vms, vm => _call('vm.suspend', { id: resolveId(vm) }))), noop)

export const pauseVm = vm => _call('vm.pause', { id: resolveId(vm) })

export const pauseVms = vms =>
  confirm({
    title: _('pauseVmsModalTitle', { vms: vms.length }),
    body: _('pauseVmsModalMessage', { vms: vms.length }),
  }).then(() => Promise.all(map(vms, pauseVm)), noop)

export const recoveryStartVm = vm => _call('vm.recoveryStart', { id: resolveId(vm) })

const stopOrRestartVm = async (vm, method, force = false) => {
  let bypassBlockedOperation = false
  const id = resolveId(vm)

  if (method !== 'stop' && method !== 'restart') {
    throw new Error(`invalid ${method}`)
  }
  const isStopOperation = method === 'stop'

  await confirm({
    title: _(isStopOperation ? 'stopVmModalTitle' : 'restartVmModalTitle'),
    body: _(isStopOperation ? 'stopVmModalMessage' : 'restartVmModalMessage', { name: vm.name_label }),
  })

  return retry(() => _call(`vm.${isStopOperation ? 'stop' : 'restart'}`, { id, force, bypassBlockedOperation }), {
    when: err => operationBlocked.is(err) || (vmLacksFeature.is(err) && !force),
    async onRetry(err) {
      if (operationBlocked.is(err)) {
        await confirm({
          title: _('blockedOperation'),
          body: _(isStopOperation ? 'stopVmBlockedModalMessage' : 'restartVmBlockedModalMessage'),
        })
        bypassBlockedOperation = true
      }
      if (vmLacksFeature.is(err) && !force) {
        await confirm({
          title: _('vmHasNoTools'),
          body: (
            <div>
              <p>{_('vmHasNoToolsMessage')}</p>
              <p>
                <strong>{_(isStopOperation ? 'confirmForceShutdown' : 'confirmForceReboot')}</strong>
              </p>
            </div>
          ),
        })
        force = true
      }
    },
    delay: 0,
  })
}

export const restartVm = (vm, hardRestart = false) => stopOrRestartVm(vm, 'restart', hardRestart)

export const restartVms = (vms, force = false) =>
  confirm({
    title: _('restartVmsModalTitle', { vms: vms.length }),
    body: _('restartVmsModalMessage', { vms: vms.length }),
  }).then(() => Promise.all(map(vms, vmId => _call('vm.restart', { id: resolveId(vmId), force }))), noop)

export const cloneVm = ({ id, name_label: nameLabel }, fullCopy = false, name) =>
  _call('vm.clone', {
    id,
    name: name === undefined ? `${nameLabel}_clone` : name,
    full_copy: fullCopy,
  })::tap(subscribeResourceSets.forceRefresh)

import CopyVmsModalBody from './copy-vms-modal' // eslint-disable-line import/first
export const copyVms = (vms, type) => {
  const _vms = resolveIds(vms)
  return confirm({
    title: type === 'VM-template' ? _('copyTemplate') : _('copyVm'),
    body: <CopyVmsModalBody vms={_vms} type={type} />,
  }).then(({ compress, copyMode, names, sr }) => {
    if (copyMode === 'fastClone') {
      return Promise.all(_vms.map((vm, index) => cloneVm({ id: vm }, false, names[index])))
    }

    if (sr !== undefined) {
      return Promise.all(_vms.map((vm, index) => _call('vm.copy', { vm, sr, compress, name: names[index] })))
    }
    error(_('copyVmsNoTargetSr'), _('copyVmsNoTargetSrMessage'))
  }, noop)
}

export const copyVm = async vm => {
  const result = await copyVms([vm], vm.type)
  return getDefined(() => result[0])
}

export const convertVmToTemplate = vm =>
  confirm({
    title: 'Convert to template',
    body: (
      <div>
        <p>Are you sure you want to convert this VM into a template?</p>
        <p>This operation is definitive.</p>
      </div>
    ),
  }).then(() => _call('vm.convertToTemplate', { id: resolveId(vm) }), noop)

export const copyToTemplate = async vm => {
  await confirm({
    title: _('copyToTemplate'),
    body: <p>{_('copyToTemplateMessage')}</p>,
  })
  await _call('vm.copyToTemplate', { id: resolveId(vm) })
}

export const changeVirtualizationMode = vm =>
  confirm({
    title: _('vmVirtualizationModeModalTitle'),
    body: _('vmVirtualizationModeModalBody'),
  }).then(() =>
    editVm(vm, {
      virtualizationMode: vm.virtualizationMode === 'hvm' ? 'pv' : 'hvm',
    })
  )

import EditVmNotesModalBody from './edit-vm-notes-modal' // eslint-disable-line import/first
export const editVmNotes = async vm => {
  const { notes } = await confirm({
    icon: 'edit',
    title: _('editVmNotes'),
    body: <EditVmNotesModalBody vm={vm} />,
  })

  // Remove notes if `''` is passed
  await _call('vm.set', { id: resolveId(vm), notes: notes || null })
}

export const createKubernetesCluster = params => _call('xoa.recipe.createKubernetesCluster', params)

export const deleteTemplates = templates =>
  confirm({
    title: _('templateDeleteModalTitle', { templates: templates.length }),
    body: _('templateDeleteModalBody', { templates: templates.length }),
  }).then(async () => {
    const defaultTemplates = []
    const protectedTemplates = []
    let nErrors = 0
    const isDefaultTemplateError = error =>
      incorrectState.is(error, {
        expected: false,
        property: 'isDefaultTemplate',
      })

    await Promise.all(
      map(resolveIds(templates), id =>
        _call('vm.delete', { id }).catch(reason => {
          if (isDefaultTemplateError(reason)) {
            defaultTemplates.push(id)
          } else if (forbiddenOperation.is(reason)) {
            protectedTemplates.push(id)
          } else {
            nErrors++
          }
        })
      )
    )

    const nProtectedTemplates = protectedTemplates.length
    let forceBlockedOperation = false

    if (nProtectedTemplates !== 0) {
      await confirm({
        title: _('deleteProtectedTemplatesTitle', { nProtectedTemplates }),
        body: _('deleteProtectedTemplatesMessage', { nProtectedTemplates }),
      })
      forceBlockedOperation = true
      await Promise.all(
        protectedTemplates.map(id =>
          _call('vm.delete', {
            id,
            forceBlockedOperation,
          }).catch(reason => {
            if (isDefaultTemplateError(reason)) {
              defaultTemplates.push(id)
            } else {
              nErrors++
            }
          })
        )
      )
    }

    const nDefaultTemplates = defaultTemplates.length
    if (nDefaultTemplates !== 0) {
      await confirm({
        title: _('deleteDefaultTemplatesTitle', { nDefaultTemplates }),
        body: _('deleteDefaultTemplatesMessage', { nDefaultTemplates }),
      })
      await Promise.all(
        defaultTemplates.map(id =>
          _call('vm.delete', {
            id,
            forceDeleteDefaultTemplate: true,
            forceBlockedOperation,
          }).catch(() => {
            nErrors++
          })
        )
      )
    }

    if (nErrors !== 0) {
      error(
        _('failedToDeleteTemplatesTitle', { nTemplates: nErrors }),
        _('failedToDeleteTemplatesMessage', { nTemplates: nErrors })
      )
    }
  }, noop)

export const snapshotVm = async (vm, name, saveMemory, description) => {
  if (saveMemory) {
    try {
      await confirm({
        title: _('newSnapshotWithMemory'),
        body: _('newSnapshotWithMemoryConfirm'),
        icon: 'memory',
      })
    } catch (error) {
      return
    }
  }
  return _call('vm.snapshot', {
    id: resolveId(vm),
    name,
    description,
    saveMemory,
  })::tap(subscribeResourceSets.forceRefresh)
}

import SnapshotVmModalBody from './snapshot-vm-modal' // eslint-disable-line import/first
export const snapshotVms = vms =>
  confirm({
    icon: 'memory',
    title: _('snapshotVmsModalTitle', { vms: vms.length }),
    body: <SnapshotVmModalBody vms={vms} />,
  })
    .then(
      ({ names, saveMemory, descriptions }) =>
        Promise.all(map(vms, vm => snapshotVm(vm, names[vm], saveMemory, descriptions[vm]))),
      noop
    )
    .catch(e => error(_('snapshotError'), e.message))

export const deleteSnapshot = vm =>
  confirm({
    title: _('deleteSnapshotModalTitle'),
    body: _('deleteSnapshotModalMessage'),
  }).then(() => _call('vm.delete', { id: resolveId(vm) }), noop)

export const deleteSnapshots = vms =>
  confirm({
    title: _('deleteSnapshotsModalTitle', { nVms: vms.length }),
    body: _('deleteSnapshotsModalMessage', { nVms: vms.length }),
  }).then(() => Promise.all(map(vms, vm => _call('vm.delete', { id: resolveId(vm) }))), noop)

// checkpoint snapshot is in a Suspended state
export const isCheckpointSnapshot = ({ power_state }) => power_state === 'Suspended'

import MigrateVmModalBody from './migrate-vm-modal' // eslint-disable-line import/first
export const migrateVm = async (vm, host) => {
  let params
  try {
    params = await confirm({
      title: _('migrateVmModalTitle'),
      body: <MigrateVmModalBody vm={vm} host={host} />,
    })
  } catch (error) {
    return
  }

  const { sr, srRequired, targetHost } = params

  if (!targetHost) {
    return error(_('migrateVmNoTargetHost'), _('migrateVmNoTargetHostMessage'))
  }

  if (srRequired && sr === undefined) {
    return error(_('migrateVmNoSr'), _('migrateVmNoSrMessage'))
  }
  delete params.srRequired

  try {
    await _call('vm.migrate', { vm: vm.id, ...params })
  } catch (error) {
    // https://developer-docs.citrix.com/projects/citrix-hypervisor-management-api/en/latest/api-ref-autogen-errors/#vmincompatiblewiththishost
    if (error != null && error.data !== undefined && error.data.code === 'VM_INCOMPATIBLE_WITH_THIS_HOST') {
      // Retry with force.
      try {
        await confirm({
          body: _('forceVmMigrateModalMessage'),
          title: _('forceVmMigrateModalTitle'),
        })
      } catch (error) {
        return
      }
      return _call('vm.migrate', { vm: vm.id, force: true, ...params })
    }
    throw error
  }
}

import MigrateVmsModalBody from './migrate-vms-modal' // eslint-disable-line import/first
export const migrateVms = vms =>
  confirm({
    title: _('migrateVmModalTitle'),
    body: <MigrateVmsModalBody vms={resolveIds(vms)} />,
  }).then(params => {
    if (isEmpty(params.vms)) {
      return
    }
    if (!params.targetHost) {
      return error(_('migrateVmNoTargetHost'), _('migrateVmNoTargetHostMessage'))
    }

    if (params.srRequired && params.sr === undefined) {
      return error(_('migrateVmNoTargetHost'), _('migrateVmNoTargetHostMessage'))
    }
    delete params.srRequired

    const { mapVmsMapVdisSrs, mapVmsMapVifsNetworks, migrationNetwork, sr, targetHost, vms } = params
    Promise.all(
      map(vms, ({ id }) =>
        _call('vm.migrate', {
          mapVdisSrs: mapVmsMapVdisSrs[id],
          mapVifsNetworks: mapVmsMapVifsNetworks[id],
          migrationNetwork,
          sr,
          targetHost,
          vm: id,
        })
      )
    )
  }, noop)

export const createVm = async args => {
  try {
    return await _call('vm.create', args)
  } catch (err) {
    handlePoolDoesNotSupportVtpmError(err)
    throw err
  }
}

export const createVms = async (args, nameLabels, cloudConfigs) => {
  await confirm({
    title: _('newVmCreateVms'),
    body: _('newVmCreateVmsConfirm', { nbVms: nameLabels.length }),
  })
  try {
    return await Promise.all(
      map(
        nameLabels,
        (
          name_label, // eslint-disable-line camelcase
          i
        ) =>
          _call('vm.create', {
            ...args,
            name_label,
            cloudConfig: get(cloudConfigs, i),
          })
      )
    )
  } catch (error) {
    handlePoolDoesNotSupportVtpmError(error)
    throw error
  }
}

export const getCloudInitConfig = template => _call('vm.getCloudInitConfig', { template })

export const pureDeleteVm = (vm, props) =>
  _call('vm.delete', { id: resolveId(vm), ...props })::tap(subscribeResourceSets.forceRefresh)

export const deleteVm = (vm, retryWithForce = true) =>
  confirm({
    title: _('deleteVmModalTitle'),
    body: _('deleteVmModalMessage'),
  })
    .then(() => pureDeleteVm(vm), noop)
    .catch(error => {
      if (retryWithForce && forbiddenOperation.is(error)) {
        return confirm({
          title: _('deleteVmBlockedModalTitle'),
          body: _('deleteVmBlockedModalMessage'),
        }).then(() => pureDeleteVm(vm, { force: true }), noop)
      }

      throw error
    })

export const deleteVms = async vms => {
  if (vms.length === 1) {
    return deleteVm(vms[0])
  }
  try {
    await confirm({
      title: _('deleteVmsModalTitle', { vms: vms.length }),
      body: _('deleteVmsModalMessage', { vms: vms.length }),
      strongConfirm: vms.length > 1 && {
        messageId: 'deleteVmsConfirmText',
        values: { nVms: vms.length },
      },
    })
  } catch (err) {
    return
  }

  let nErrors = 0
  await Promise.all(
    map(vms, vmId =>
      _call('vm.delete', { id: resolveId(vmId) }).catch(() => {
        nErrors++
      })
    )
  )

  if (nErrors > 0) {
    error(_('failedDeleteErrorTitle'), _('failedVmsErrorMessage', { nVms: nErrors }))
  }
}

export const coalesceLeafVm = async vm => {
  if (vm.power_state !== 'Halted' && vm.power_state !== 'Suspended') {
    await confirm({
      title: _('coalesceLeaf'),
      body: _('coalesceLeafSuspendVm'),
    })
  }
  await _call('vm.coalesceLeaf', { id: resolveId(vm) })

  success(_('coalesceLeaf'), _('coalesceLeafSuccess'))
}

export const importBackup = ({ remote, file, sr }) => _call('vm.importBackup', resolveIds({ remote, file, sr }))

export const importDeltaBackup = ({ remote, file, sr, mapVdisSrs }) =>
  _call(
    'vm.importDeltaBackup',
    resolveIds({
      remote,
      filePath: file,
      sr,
      mapVdisSrs: resolveIds(mapVdisSrs),
    })
  )

import RevertSnapshotModalBody from './revert-snapshot-modal' // eslint-disable-line import/first
export const revertSnapshot = snapshot =>
  confirm({
    title: _('revertVmModalTitle'),
    body: <RevertSnapshotModalBody />,
  }).then(async snapshotBefore => {
    if (snapshotBefore) {
      await _call('vm.snapshot', { id: snapshot.$snapshot_of })
    }
    await _call('vm.revert', { snapshot: snapshot.id })::tap(subscribeResourceSets.forceRefresh)
    success(_('vmRevertSuccessfulTitle'), _('vmRevertSuccessfulMessage'))
  }, noop)

export const editVm = async (vm, props) => {
  if (props.hasVendorDevice) {
    try {
      await confirm({
        title: _('windowsToolsModalTitle'),
        body: (
          <div>
            <p>{_('windowsToolsModalMessage')}</p>
            <p className='text-warning'>
              <Icon icon='alarm' />
              &nbsp;
              {_('windowsToolsModalWarning')}
            </p>
          </div>
        ),
      })
    } catch (err) {
      if (err !== undefined) {
        throw err
      }
      return
    }
  }
  await _call('vm.set', { ...props, id: resolveId(vm) })
    .catch(async err => {
      if (vmBadPowerState.is(err, { actual: 'running' }) || err.message === 'Cannot change memory on running VM') {
        try {
          const force = await chooseAction({
            body: <p>{_('vmEditAndRestartModalMessage')}</p>,
            buttons: [
              { label: _('rebootVmLabel'), value: false, btnStyle: 'success' },
              { label: _('forceRebootVmLabel'), value: true, btnStyle: 'danger' },
            ],
            icon: 'vm-reboot',
            title: _('vmEditAndRestartModalTitle'),
          })
          await _call('vm.setAndRestart', { ...props, id: resolveId(vm), force })
        } catch (err) {
          if (err !== undefined) {
            error(_('setAndRestartVmFailed', { vm: renderXoItemFromId(resolveId(vm)) }), err.message)
            throw err
          }
        }
      } else {
        error(_('setVmFailed', { vm: renderXoItemFromId(resolveId(vm)) }), err.message)
      }
    })
    ::tap(() => {
      subscribeResourceSets.forceRefresh()
      if (props.secureBoot !== undefined) {
        subscribeSecurebootReadiness.forceRefresh(vm)
      }
    })
}

export const fetchVmStats = (vm, granularity) => _call('vm.stats', { id: resolveId(vm), granularity })

export const getVmsHaValues = () => _call('vm.getHaValues')

export const importVm = async (file, type = 'xva', data = undefined, sr, url = undefined) => {
  const { name } = file

  info(_('startVmImport'), name)
  // eslint-disable-next-line no-undef
  const formData = new FormData()
  if (data !== undefined && data.tables !== undefined) {
    for (const k in data.tables) {
      const tables = await data.tables[k]
      delete data.tables[k]
      for (const l in tables) {
        // eslint-disable-next-line no-undef
        const blob = new Blob([tables[l]])
        formData.append(l, blob, k)
      }
    }
  }
  const result = await _call('vm.import', { type, data, sr: resolveId(sr), url })
  if (url !== undefined) {
    // If imported from URL, result is the ID of the created VM
    success(_('vmImportSuccess'), name)
    return [result]
  }
  formData.append('file', file)
  const res = await post(result.$sendTo, formData)
  const json = await res.json()
  if (res.status !== 200) {
    error(_('vmImportFailed'), name)
    throw json.error
  }
  success(_('vmImportSuccess'), name)
  return json.result
}

import ImportVdiModalBody from './import-vdi-modal' // eslint-disable-line import/first
export const importVdi = async vdi => {
  const file = await confirm({
    body: <ImportVdiModalBody />,
    icon: 'import',
    title: _('importVdi'),
  })

  if (file === undefined) {
    error(_('importVdi'), _('importVdiNoFile'))
    return
  }

  const { name } = file
  info(_('startVdiImport'), name)

  return _call('disk.importContent', { id: resolveId(vdi) }).then(({ $sendTo }) =>
    post($sendTo, file)
      .then(res => {
        if (res.status !== 200) {
          throw res.status
        }
        success(_('vdiImportSuccess'), name)
        return res.json().then(body => body.result)
      })
      .catch(err => {
        error(_('vdiImportFailed'), err)
      })
  )
}

export const importVms = (vms, sr) =>
  Promise.all(
    map(vms, ({ file, type, data }) =>
      importVm(file, type, data, sr).catch(error => {
        console.warn('importVms', file.name, error)
      })
    )
  ).then(ids => ids.filter(_ => _ !== undefined))

const importDisk = async ({ description, file, name, type, vmdkData, url = undefined }, sr) => {
  // eslint-disable-next-line no-undef
  const formData = new FormData()
  if (vmdkData !== undefined) {
    for (const l of ['grainLogicalAddressList', 'grainFileOffsetList']) {
      const table = await vmdkData[l]
      delete vmdkData[l]
      // eslint-disable-next-line no-undef
      const blob = new Blob([table])
      formData.append(l, blob, file.name)
    }
  }
  const res = await _call('disk.import', {
    description,
    name,
    sr: resolveId(sr),
    type,
    vmdkData,
    url,
  })

  if (url !== undefined) {
    success(_('vdiImportSuccess'), name)
    return res
  }

  formData.append('file', file)
  const result = await post(res.$sendTo, formData)
  const text = await result.text()
  let body
  try {
    body = JSON.parse(text)
  } catch (error) {
    throw new Error(`Body is not a JSON, original message is : ${text}`)
  }
  if (result.status !== 200) {
    throw new Error(body.error.message)
  }
  await body.result
}

export const importDisks = (disks, sr) =>
  Promise.all(
    map(disks, disk =>
      importDisk(disk, sr).catch(err => {
        error(_('diskImportFailed'), err.message)
        throw err
      })
    )
  )

export const getBlockdevices = host => _call('host.getBlockdevices', { id: resolveId(host) })

import ExportVmModalBody from './export-vm-modal' // eslint-disable-line import/first
export const exportVm = async vm => {
  const { compression, format } = await confirm({
    body: <ExportVmModalBody vm={vm} />,
    icon: 'export',
    title: _('exportVmLabel'),
  })
  const id = resolveId(vm)
  const { $getFrom: url } = await _call('vm.export', { vm: id, compress: compression, format })
  const fullUrl = window.location.origin + url
  const copytoClipboard = () => copy(fullUrl)
  const _info = () => info(_('startVmExport'), id)

  await confirm({
    body: (
      <div>
        <a href={fullUrl} target='_blank' rel='noreferrer' onClick={_info}>
          {_('downloadVm')}
        </a>{' '}
        <ActionButton handler={copytoClipboard} icon='clipboard' tooltip={_('copyExportedUrl')} size='small' />
        <br />
        <Icon icon='info' /> <em>{_('vmExportUrlValidity')}</em>
      </div>
    ),
    icon: 'download',
    title: _('downloadVm'),
  })
  _info()
  window.open(`.${url}`)
}

import ExportVdiModalBody from './export-vdi-modal' // eslint-disable-line import/first
export const exportVdi = async vdi => {
  const format = await confirm({
    body: <ExportVdiModalBody />,
    icon: 'export',
    title: _('exportVdi'),
  })

  info(_('startVdiExport'), vdi.id)

  if (format === 'raw') {
    return window.open(`./rest/v0/vdis/${resolveId(vdi)}.raw`)
  }

  return _call('disk.exportContent', { id: resolveId(vdi), format }).then(({ $getFrom: url }) => {
    window.open(`.${url}`)
  })
}

export const insertCd = (vm, cd, force = false) =>
  _call('vm.insertCd', {
    id: resolveId(vm),
    cd_id: resolveId(cd),
    force,
  })

export const ejectCd = vm => _call('vm.ejectCd', { id: resolveId(vm) })

export const setVmBootOrder = (vm, order) =>
  _call('vm.setBootOrder', {
    vm: resolveId(vm),
    order,
  })

export const attachDiskToVm = (vdi, vm, { bootable, mode, position }) =>
  _call('vm.attachDisk', {
    bootable,
    mode,
    position: (position && String(position)) || undefined,
    vdi: resolveId(vdi),
    vm: resolveId(vm),
  })

export const createVgpu = (vm, { gpuGroup, vgpuType }) => _call('vm.createVgpu', resolveIds({ vm, gpuGroup, vgpuType }))

export const deleteVgpu = vgpu => _call('vm.deleteVgpu', resolveIds({ vgpu }))

export const shareVm = async (vm, resourceSet) =>
  confirm({
    title: _('shareVmInResourceSetModalTitle'),
    body: _('shareVmInResourceSetModalMessage', {
      self: renderXoItem({
        ...(await getResourceSet(resourceSet)),
        type: 'resourceSet',
      }),
    }),
  }).then(() => editVm(vm, { share: true }), noop)

export const vmWarmMigration = async vm => {
  const { sr, deleteSourceVm, startDestinationVm } = await confirm({
    body: <WarmMigrationModal />,
    title: _('vmWarmMigration'),
    icon: 'vm-warm-migration',
  })
  return _call('vm.warmMigration', {
    deleteSourceVm,
    sr: resolveId(sr),
    startDestinationVm,
    vm: resolveId(vm),
  })
}

// DISK ---------------------------------------------------------------

export const createDisk = (name, size, sr, { vm, bootable, mode, position }) =>
  _call('disk.create', {
    bootable,
    mode,
    name,
    position,
    size,
    sr: resolveId(sr),
    vm: resolveId(vm),
  })

// VDI ---------------------------------------------------------------

export const editVdi = (vdi, props) => _call('vdi.set', { ...props, id: resolveId(vdi) })

export const deleteVdi = vdi =>
  confirm({
    title: _('deleteVdiModalTitle'),
    body: _('deleteVdiModalMessage'),
  }).then(() => _call('vdi.delete', { id: resolveId(vdi) }), noop)

export const deleteVdis = vdis =>
  confirm({
    title: _('deleteVdisModalTitle', { nVdis: vdis.length }),
    body: _('deleteVdisModalMessage', { nVdis: vdis.length }),
  }).then(() => Promise.all(map(vdis, vdi => _call('vdi.delete', { id: resolveId(vdi) }))), noop)

export const deleteOrphanedVdis = vdis =>
  confirm({
    title: _('deleteOrphanedVdisModalTitle'),
    body: (
      <div>
        <p>{_('deleteOrphanedVdisModalMessage', { nVdis: vdis.length })}</p>
        <p>{_('definitiveMessageModal')}</p>
      </div>
    ),
  }).then(() => Promise.all(map(resolveIds(vdis), id => _call('vdi.delete', { id }))), noop)

export const migrateVdi = (vdi, sr, resourceSet) =>
  _call('vdi.migrate', {
    id: resolveId(vdi),
    resourceSet,
    sr_id: resolveId(sr),
  })

export const setCbt = (vdi, cbt) =>
  _call('vdi.set', { id: resolveId(vdi), cbt }).catch(err => error(_('setCbtError'), err.message || String(err)))

// VBD ---------------------------------------------------------------

export const connectVbd = vbd => _call('vbd.connect', { id: resolveId(vbd) })

export const disconnectVbd = vbd => _call('vbd.disconnect', { id: resolveId(vbd) })

export const disconnectVbds = vbds =>
  confirm({
    title: _('disconnectVbdsModalTitle', { nVbds: vbds.length }),
    body: _('disconnectVbdsModalMessage', { nVbds: vbds.length }),
  }).then(() => Promise.all(map(vbds, vbd => _call('vbd.disconnect', { id: resolveId(vbd) }))), noop)

export const deleteVbd = vbd => _call('vbd.delete', { id: resolveId(vbd) })

export const deleteVbds = vbds =>
  confirm({
    title: _('deleteVbdsModalTitle', { nVbds: vbds.length }),
    body: _('deleteVbdsModalMessage', { nVbds: vbds.length }),
  }).then(() => Promise.all(map(vbds, vbd => _call('vbd.delete', { id: resolveId(vbd) }))), noop)

export const editVbd = (vbd, props) => _call('vbd.set', { ...props, id: resolveId(vbd) })

export const setBootableVbd = (vbd, bootable) => _call('vbd.setBootable', { vbd: resolveId(vbd), bootable })

// VIF ---------------------------------------------------------------

export const createVmInterface = (vm, network, mac) => _call('vm.createInterface', resolveIds({ vm, network, mac }))

export const connectVif = vif => _call('vif.connect', { id: resolveId(vif) })

export const disconnectVif = vif => _call('vif.disconnect', { id: resolveId(vif) })

export const deleteVif = vif => _call('vif.delete', { id: resolveId(vif) })

export const deleteVifs = vifs =>
  confirm({
    title: _('deleteVifsModalTitle', { nVifs: vifs.length }),
    body: _('deleteVifsModalMessage', { nVifs: vifs.length }),
  }).then(() => Promise.all(map(vifs, vif => _call('vif.delete', { id: resolveId(vif) }))), noop)

export const setVif = (
  vif,
  { allowedIpv4Addresses, allowedIpv6Addresses, lockingMode, mac, network, rateLimit, resourceSet, txChecksumming }
) =>
  _call('vif.set', {
    allowedIpv4Addresses,
    allowedIpv6Addresses,
    id: resolveId(vif),
    lockingMode,
    mac,
    network: resolveId(network),
    rateLimit,
    resourceSet,
    txChecksumming,
  })

export const getLockingModeValues = () => _call('vif.getLockingModeValues')

export const addAclRule = ({ allow, protocol = undefined, port = undefined, ipRange = '', direction, vif }) =>
  _call('sdnController.addRule', {
    allow,
    protocol,
    port,
    ipRange,
    direction,
    vifId: resolveId(vif),
  })

export const deleteAclRule = ({ protocol = undefined, port = undefined, ipRange = '', direction, vif }) =>
  _call('sdnController.deleteRule', {
    protocol,
    port,
    ipRange,
    direction,
    vifId: resolveId(vif),
  })

// VTPM -----------------------------------------------------------
const handlePoolDoesNotSupportVtpmError = err => {
  if (
    incorrectState.is(err, {
      property: 'restrictions.restrict_vtpm',
      expected: 'false',
    })
  ) {
    console.error(err)
    throw new Error('This pool does not support VTPM')
  }
}

export const createVtpm = async vm => {
  try {
    return await _call('vtpm.create', { id: resolveId(vm) })
  } catch (err) {
    handlePoolDoesNotSupportVtpmError(err)
    throw err
  }
}
export const deleteVtpm = vtpm => _call('vtpm.destroy', { id: resolveId(vtpm) })

export const editPusb = (pusb, props) => _call('pusb.set', { id: resolveId(pusb), ...props })

export const createVusb = (vm, usbGroup) => _call('vusb.create', { vm: resolveId(vm), usbGroup: resolveId(usbGroup) })

export const unplugVusb = vusb => _call('vusb.unplug', { id: resolveId(vusb) })

export const deleteVusb = vusb => _call('vusb.destroy', { id: resolveId(vusb) })

// Network -----------------------------------------------------------

export const editNetwork = (network, props) => _call('network.set', { ...props, id: resolveId(network) })

export const getBondModes = () => _call('network.getBondModes')
export const createNetwork = params => _call('network.create', params)
export const createBondedNetwork = params => _call('network.createBonded', params)
export const createPrivateNetwork = ({ preferredCenter, ...params }) =>
  _call('sdnController.createPrivateNetwork', {
    ...params,
    preferredCenterId: preferredCenter !== null ? resolveId(preferredCenter) : undefined,
  })

export const deleteNetwork = network =>
  confirm({
    title: _('deleteNetwork'),
    body: _('deleteNetworkConfirm'),
  }).then(() => _call('network.delete', { network: resolveId(network) }), noop)

// PIF ---------------------------------------------------------------

export const connectPif = pif =>
  confirm({
    title: _('connectPif'),
    body: _('connectPifConfirm'),
  }).then(() => _call('pif.connect', { pif: resolveId(pif) }), noop)

export const disconnectPif = pif =>
  confirm({
    title: _('disconnectPif'),
    body: _('disconnectPifConfirm'),
  }).then(() => _call('pif.disconnect', { pif: resolveId(pif) }), noop)

export const deletePif = pif =>
  confirm({
    title: _('deletePif'),
    body: _('deletePifConfirm'),
  }).then(() => _call('pif.delete', { pif: resolveId(pif) }), noop)

export const deletePifs = pifs =>
  confirm({
    title: _('deletePifs'),
    body: _('deletePifsConfirm', { nPifs: pifs.length }),
  }).then(() => Promise.all(map(pifs, pif => _call('pif.delete', { pif: resolveId(pif) }))), noop)

export const reconfigurePifIp = (pif, { mode, ip, ipv6, ipv6Mode, netmask, gateway, dns }) =>
  _call('pif.reconfigureIp', {
    pif: resolveId(pif),
    mode,
    ip,
    ipv6,
    ipv6Mode,
    netmask,
    gateway,
    dns,
  })

export const getIpv4ConfigModes = () => _call('pif.getIpv4ConfigurationModes')

export const getIpv6ConfigModes = () => _call('pif.getIpv6ConfigurationModes')

export const editPif = (pif, { vlan }) => _call('pif.editPif', { pif: resolveId(pif), vlan })

export const scanHostPifs = hostId => _call('host.scanPifs', { host: hostId })

// SR ----------------------------------------------------------------

export const deleteSr = sr =>
  confirm({
    title: 'Delete SR',
    body: (
      <div>
        <p>Are you sure you want to remove this SR?</p>
        <p>This operation is definitive, and ALL DISKS WILL BE LOST FOREVER.</p>
      </div>
    ),
  }).then(() => _call('sr.destroy', { id: resolveId(sr) }), noop)

export const fetchSrStats = (sr, granularity) => _call('sr.stats', { id: resolveId(sr), granularity })

export const forgetSr = sr => forgetSrs([sr])

export const forgetSrs = srs =>
  confirm({
    title: _('nSrsForget', { nSrs: srs.length }),
    body: (
      <p className='text-warning font-weight-bold'>
        {_('forgetNSrsModalMessage', { nSrs: srs.length })} {_('srForgetModalWarning')}
      </p>
    ),
    strongConfirm: {
      messageId: 'nSrsForget',
      values: { nSrs: srs.length },
    },
  }).then(() => Promise.all(map(resolveIds(srs), id => _call('sr.forget', { id }))), noop)

export const reconnectAllHostsSr = sr =>
  confirm({
    title: _('srReconnectAllModalTitle'),
    body: _('srReconnectAllModalMessage'),
  }).then(() => _call('sr.connectAllPbds', { id: resolveId(sr) }), noop)
export const reconnectAllHostsSrs = srs =>
  confirm({
    title: _('srReconnectAllModalTitle'),
    body: _('srReconnectAllModalMessage'),
  }).then(() => Promise.all(resolveIds(srs), id => _call('sr.connectAllPbds', { id })), noop)

export const disconnectAllHostsSr = sr =>
  confirm({
    title: _('srDisconnectAllModalTitle'),
    body: _('srDisconnectAllModalMessage'),
  }).then(() => _call('sr.disconnectAllPbds', { id: resolveId(sr) }), noop)
export const disconnectAllHostsSrs = srs =>
  confirm({
    title: _('srDisconnectAllModalTitle'),
    body: _('srsDisconnectAllModalMessage'),
  }).then(() => Promise.all(resolveIds(srs), id => _call('sr.disconnectAllPbds', { id })), noop)

export const editSr = (sr, { nameDescription, nameLabel }) =>
  _call('sr.set', {
    id: resolveId(sr),
    name_description: nameDescription,
    name_label: nameLabel,
  })

export const rescanSr = sr => _call('sr.scan', { id: resolveId(sr) })
export const rescanSrs = srs => Promise.all(map(resolveIds(srs), id => _call('sr.scan', { id })))

export const toggleSrMaintenanceMode = sr => {
  const id = resolveId(sr)
  const method = sr.inMaintenanceMode ? 'disableMaintenanceMode' : 'enableMaintenanceMode'

  return _call(`sr.${method}`, { id }).catch(async err => {
    if (
      incorrectState.is(err, {
        property: 'vmsToShutdown',
      })
    ) {
      const vmIds = err.data.expected
      const nVms = vmIds.length
      await confirm({
        title: _('maintenanceMode'),
        body: (
          <div>
            {_('maintenanceSrModalBody', { n: nVms })}
            <ul>
              {vmIds.slice(0, MAX_VMS).map(id => (
                <li key={id}>
                  <Vm id={id} />
                </li>
              ))}
            </ul>
            {nVms > MAX_VMS && _('andNMore', { n: nVms - MAX_VMS })}
          </div>
        ),
      })
      return _call(`sr.${method}`, { id, vmsToShutdown: vmIds })
    } else {
      throw err
    }
  })
}

export const reclaimSrSpace = async sr => {
  await confirm({
    icon: 'sr-reclaim-space',
    title: _('srReclaimSpace'),
    body: _('srReclaimSpaceConfirm'),
  })

  try {
    await _call('sr.reclaimSpace', { id: resolveId(sr) })
    success(_('srReclaimSpace'))
  } catch (err) {
    if (err?.data?.message?.includes('Operation not supported')) {
      throw new Error('Space reclaim not supported. Only supported on block based/LVM based SRs.')
    }
    throw err
  }
}

// PBDs --------------------------------------------------------------

export const connectPbd = pbd => _call('pbd.connect', { id: resolveId(pbd) })

export const disconnectPbd = pbd => _call('pbd.disconnect', { id: resolveId(pbd) })

export const deletePbd = pbd => _call('pbd.delete', { id: resolveId(pbd) })

export const deletePbds = pbds => Promise.all(map(pbds, deletePbd))

// Messages ----------------------------------------------------------

export const deleteMessage = message => _call('message.delete', { id: resolveId(message) })

export const deleteMessages = logs =>
  confirm({
    title: _('logDeleteMultiple', { nLogs: logs.length }),
    body: _('logDeleteMultipleMessage', { nLogs: logs.length }),
  }).then(() => Promise.all(map(logs, deleteMessage)), noop)

// Tags --------------------------------------------------------------

export const addTag = (object, tag) => _call('tag.add', { id: resolveId(object), tag })

export const setTag = (id, params) => _call('tag.set', { id, ...params })::tap(subscribeConfiguredTags.forceRefresh)

export const removeTag = (object, tag) => _call('tag.remove', { id: resolveId(object), tag })

// Custom fields ------------------------------------------------------------------------

export const addCustomField = (id, name, value) => _call('customField.add', { id, name, value })

export const removeCustomField = (id, name) => _call('customField.remove', { id, name })

export const setCustomField = (id, name, value) => _call('customField.set', { id, name, value })

// Tasks --------------------------------------------------------------

export const cancelTask = task => _call('task.cancel', { id: resolveId(task) })

export const cancelTasks = tasks =>
  confirm({
    title: _('cancelTasksModalTitle', { nTasks: tasks.length }),
    body: _('cancelTasksModalMessage', { nTasks: tasks.length }),
  }).then(() => Promise.all(map(tasks, task => _call('task.cancel', { id: resolveId(task) }))), noop)

export const destroyTask = task => _call('task.destroy', { id: resolveId(task) })

export const destroyTasks = tasks =>
  confirm({
    title: _('destroyTasksModalTitle', { nTasks: tasks.length }),
    body: _('destroyTasksModalMessage', { nTasks: tasks.length }),
  }).then(() => Promise.all(map(tasks, task => _call('task.destroy', { id: resolveId(task) }))), noop)

// XO Tasks --------------------------------------------------------------

export const abortXoTask = async task => {
  const response = await fetch(`./rest/v0/tasks/${task.id}/actions/abort`, { method: 'POST' })
  if (!response.ok) {
    throw new Error(await response.text())
  }
}

export const deleteXoTaskLog = async task => {
  const response = await fetch(`./rest/v0/tasks/${task.id}`, { method: 'DELETE' })
  if (!response.ok) {
    throw new Error(await response.text())
  }
}

// Jobs -------------------------------------------------------------

export const createJob = job => _call('job.create', { job })::tap(subscribeJobs.forceRefresh)

export const deleteJob = job => _call('job.delete', { id: resolveId(job) })::tap(subscribeJobs.forceRefresh)

export const deleteJobs = jobs =>
  confirm({
    title: _('deleteJobsModalTitle', { nJobs: jobs.length }),
    body: _('deleteJobsModalMessage', { nJobs: jobs.length }),
  }).then(
    () => Promise.all(map(jobs, job => _call('job.delete', { id: resolveId(job) })))::tap(subscribeJobs.forceRefresh),
    noop
  )

export const editJob = job => _call('job.set', { job })::tap(subscribeJobs.forceRefresh)

export const getJob = id => _call('job.get', { id })

export const runJob = job => {
  info(_('runJob'), _('runJobVerbose'))
  return _call('job.runSequence', { idSequence: [resolveId(job)] })
}

export const cancelJob = ({ id, name, runId }) =>
  confirm({
    title: _('cancelJob'),
    body: _('cancelJobConfirm', {
      id: id.slice(0, 5),
      name: <strong>{name}</strong>,
    }),
  }).then(() => _call('job.cancel', { runId }))

// Backup/Schedule ---------------------------------------------------------

export const createSchedule = (jobId, { cron, enabled, name = undefined, timezone = undefined }) =>
  _call('schedule.create', { jobId, cron, enabled, name, timezone })::tap(subscribeSchedules.forceRefresh)

export const deleteBackupSchedule = async schedule => {
  await confirm({
    title: _('deleteBackupSchedule'),
    body: _('deleteBackupScheduleQuestion'),
  })
  await _call('schedule.delete', { id: schedule.id })
  await _call('job.delete', { id: schedule.jobId })

  subscribeSchedules.forceRefresh()
  subscribeJobs.forceRefresh()
}

export const deleteSchedule = schedule =>
  _call('schedule.delete', { id: resolveId(schedule) })::tap(subscribeSchedules.forceRefresh)

export const deleteSchedules = schedules =>
  confirm({
    title: _('deleteSchedulesModalTitle', { nSchedules: schedules.length }),
    body: _('deleteSchedulesModalMessage', { nSchedules: schedules.length }),
  }).then(() =>
    Promise.all(
      map(schedules, schedule =>
        _call('schedule.delete', { id: resolveId(schedule) })::tap(subscribeSchedules.forceRefresh)
      )
    )
  )

export const disableSchedule = id => editSchedule({ id, enabled: false })

export const editSchedule = ({ id, jobId, cron, enabled, name, timezone }) =>
  _call('schedule.set', { id, jobId, cron, enabled, name, timezone })::tap(subscribeSchedules.forceRefresh)

export const enableSchedule = id => editSchedule({ id, enabled: true })

export const getSchedule = id => _call('schedule.get', { id })

// Backup NG ---------------------------------------------------------

export const subscribeBackupNgJobs = createSubscription(() => _call('backupNg.getAllJobs'))

export const subscribeBackupNgLogs = createSubscription(async () => {
  const { $getFrom } = await _call('backupNg.getAllLogs', { ndjson: true })
  const response = await fetch(`.${$getFrom}`)
  const data = await response.text()

  const logs = { __proto__: null }
  parseNdJson(data, log => {
    logs[log.id] = log
  })
  return logs
})

export const subscribeMetadataBackupJobs = createSubscription(() => _call('metadataBackup.getAllJobs'))

export const createBackupNgJob = props => _call('backupNg.createJob', props)::tap(subscribeBackupNgJobs.forceRefresh)

export const getSuggestedExcludedTags = () => _call('backupNg.getSuggestedExcludedTags')

export const deleteBackupJobs = async ({ backupIds = [], metadataBackupIds = [], mirrorBackupIds = [] }) => {
  const nJobs = backupIds.length + metadataBackupIds.length + mirrorBackupIds.length
  if (nJobs === 0) {
    return
  }
  const vars = { nJobs }
  try {
    await confirm({
      title: _('confirmDeleteBackupJobsTitle', vars),
      body: <p>{_('confirmDeleteBackupJobsBody', vars)}</p>,
    })
  } catch (_) {
    return
  }

  const promises = []
  if (backupIds.length !== 0) {
    promises.push(
      Promise.all(backupIds.map(id => _call('backupNg.deleteJob', { id: resolveId(id) })))::tap(
        subscribeBackupNgJobs.forceRefresh
      )
    )
  }
  if (metadataBackupIds.length !== 0) {
    promises.push(
      Promise.all(metadataBackupIds.map(id => _call('metadataBackup.deleteJob', { id: resolveId(id) })))::tap(
        subscribeMetadataBackupJobs.forceRefresh
      )
    )
  }
  if (mirrorBackupIds.length !== 0) {
    promises.push(
      Promise.all(mirrorBackupIds.map(id => _call('mirrorBackup.deleteJob', { id: resolveId(id) })))::tap(
        subscribeMirrorBackupJobs.forceRefresh
      )
    )
  }

  return Promise.all(promises)::tap(subscribeSchedules.forceRefresh)
}

export const editBackupNgJob = props => _call('backupNg.editJob', props)::tap(subscribeBackupNgJobs.forceRefresh)

export const getBackupNgJob = id => _call('backupNg.getJob', { id })

export const runBackupNgJob = ({ force, ...params }) => {
  if (force) {
    params.settings = {
      '': {
        bypassVdiChainsCheck: true,
      },
    }
  }
  return _call('backupNg.runJob', params)
}

export const listVmBackups = remotes => _call('backupNg.listVmBackups', { remotes: resolveIds(remotes) })

export const restoreBackup = (
  backup,
  sr,
  { generateNewMacAddresses = false, mapVdisSrs = {}, startOnRestore = false, useDifferentialRestore = false } = {}
) => {
  const promise = _call('backupNg.importVmBackup', {
    id: resolveId(backup),
    settings: { mapVdisSrs: resolveIds(mapVdisSrs), newMacAddresses: generateNewMacAddresses, useDifferentialRestore },
    sr: resolveId(sr),
  })

  if (startOnRestore) {
    return promise.then(startVm)
  }

  return promise
}

export const checkBackup = (backup, sr, { mapVdisSrs = {} } = {}) => {
  return _call('backupNg.checkBackup', {
    id: resolveId(backup),
    settings: { mapVdisSrs: resolveIds(mapVdisSrs) },
    sr: resolveId(sr),
  })
}

export const deleteBackup = backup => _call('backupNg.deleteVmBackup', { id: resolveId(backup) })

export const deleteBackups = async backups =>
  _call('backupNg.deleteVmBackups', { ids: backups.map(backup => resolveId(backup)) })

export const createMetadataBackupJob = props =>
  _call('metadataBackup.createJob', props)
    ::tap(subscribeMetadataBackupJobs.forceRefresh)
    ::tap(subscribeSchedules.forceRefresh)

export const editMetadataBackupJob = props =>
  _call('metadataBackup.editJob', props)
    ::tap(subscribeMetadataBackupJobs.forceRefresh)
    ::tap(subscribeSchedules.forceRefresh)

export const runMetadataBackupJob = params => _call('metadataBackup.runJob', params)

export const listMetadataBackups = remotes => _call('metadataBackup.list', { remotes: resolveIds(remotes) })

export const restoreMetadataBackup = data =>
  _call('metadataBackup.restore', {
    id: resolveId(data.backup),
    pool: data.pool,
  })::tap(subscribeBackupNgLogs.forceRefresh)

export const deleteMetadataBackup = backup =>
  _call('metadataBackup.delete', {
    id: resolveId(backup),
  })

export const deleteMetadataBackups = async (backups = []) => {
  // delete sequentially from newest to oldest
  backups = backups.slice().sort((b1, b2) => b2.timestamp - b1.timestamp)
  for (let i = 0, n = backups.length; i < n; ++i) {
    await deleteMetadataBackup(backups[i])
  }
}

// Mirror backup ---------------------------------------------------------

export const subscribeMirrorBackupJobs = createSubscription(() => _call('mirrorBackup.getAllJobs'))

export const createMirrorBackupJob = props =>
  _call('mirrorBackup.createJob', props)::tap(subscribeMirrorBackupJobs.forceRefresh)

export const runMirrorBackupJob = props => _call('mirrorBackup.runJob', props)

export const editMirrorBackupJob = props => _call('mirrorBackup.editJob', props)

// Plugins -----------------------------------------------------------

export const loadPlugin = async id =>
  _call('plugin.load', { id })::tap(subscribePlugins.forceRefresh, err =>
    error(_('pluginError'), (err && err.message) || _('unknownPluginError'))
  )

export const unloadPlugin = id =>
  _call('plugin.unload', { id })::tap(subscribePlugins.forceRefresh, err =>
    error(_('pluginError'), (err && err.message) || _('unknownPluginError'))
  )

export const enablePluginAutoload = id => _call('plugin.enableAutoload', { id })::tap(subscribePlugins.forceRefresh)

export const disablePluginAutoload = id => _call('plugin.disableAutoload', { id })::tap(subscribePlugins.forceRefresh)

export const configurePlugin = (id, configuration) =>
  _call('plugin.configure', { id, configuration })::tap(
    () => {
      info(_('pluginConfigurationSuccess'), _('pluginConfigurationChanges'))
      subscribePlugins.forceRefresh()
    },
    err => error(_('pluginError'), JSON.stringify(err.data) || _('unknownPluginError'))
  )

export const getPlugin = async id => {
  const { user } = store.getState()
  if (user != null && user.permission === 'admin') {
    return (await _call('plugin.get')).find(plugin => plugin.id === id)
  }
}

export const purgePluginConfiguration = async id => {
  await confirm({
    title: _('purgePluginConfiguration'),
    body: _('purgePluginConfigurationQuestion'),
  })
  await _call('plugin.purgeConfiguration', { id })

  subscribePlugins.forceRefresh()
}

export const testPlugin = (id, data) => _call('plugin.test', { id, data })

export const sendUsageReport = () => _call('plugin.usageReport.send')

// Resource set ------------------------------------------------------

export const createResourceSet = (name, { shareByDefault, subjects, objects, tags, limits } = {}) =>
  _call('resourceSet.create', { name, shareByDefault, subjects, objects, tags, limits })::tap(
    subscribeResourceSets.forceRefresh
  )

export const editResourceSet = (id, { name, shareByDefault, subjects, objects, tags, limits, ipPools } = {}) =>
  _call('resourceSet.set', {
    id,
    name,
    shareByDefault,
    subjects,
    objects,
    tags,
    limits,
    ipPools,
  })::tap(subscribeResourceSets.forceRefresh)

export const deleteResourceSet = async id => {
  await confirm({
    title: _('deleteResourceSetWarning'),
    body: _('deleteResourceSetQuestion'),
  })
  await _call('resourceSet.delete', { id: resolveId(id) })

  subscribeResourceSets.forceRefresh()
}

export const recomputeResourceSetsLimits = () =>
  _call('resourceSet.recomputeAllLimits')::tap(subscribeResourceSets.forceRefresh)

export const getResourceSet = id => _call('resourceSet.get', { id: resolveId(id) })

// Remote ------------------------------------------------------------

export const getRemotes = () => _call('remote.getAll')

export const getRemote = remote =>
  _call('remote.get', resolveIds({ id: remote }))::tap(null, err => error(_('getRemote'), err.message || String(err)))

export const createRemote = (name, url, options, proxy) =>
  _call('remote.create', {
    name,
    options,
    proxy: resolveId(proxy),
    url,
  })::tap(remote => {
    testRemote(remote).catch(noop)
  })

export const deleteRemote = remote =>
  _call('remote.delete', { id: resolveId(remote) })::tap(subscribeRemotes.forceRefresh)

export const deleteRemotes = remotes =>
  confirm({
    title: _('deleteRemotesModalTitle', { nRemotes: remotes.length }),
    body: _('deleteRemotesModalMessage', { nRemotes: remotes.length }),
  }).then(
    () =>
      Promise.all(map(remotes, remote => _call('remote.delete', { id: resolveId(remote) })))::tap(
        subscribeRemotes.forceRefresh
      ),
    noop
  )

export const enableRemote = remote =>
  _call('remote.set', { id: resolveId(remote), enabled: true })::tap(() => testRemote(remote).catch(noop))

export const disableRemote = remote =>
  _call('remote.set', { id: resolveId(remote), enabled: false })::tap(subscribeRemotes.forceRefresh)

export const editRemote = (remote, { name, options, proxy, url }) =>
  _call('remote.set', {
    id: remote.id,
    name,
    options,
    proxy: resolveId(proxy),
    url,
  })::tap(() => {
    subscribeRemotes.forceRefresh()
    if (remote.enabled) {
      testRemote(remote).catch(noop)
    }
  })

export const testRemote = remote =>
  _call('remote.test', resolveIds({ id: remote }))
    ::tap(null, err => error(_('testRemote'), err.message || String(err)))
    ::pFinally(subscribeRemotes.forceRefresh)

// File restore  ----------------------------------------------------

export const listPartitions = (remote, disk) => _call('backupNg.listPartitions', resolveIds({ remote, disk }))

export const listFiles = (remote, disk, path, partition) =>
  _call('backupNg.listFiles', resolveIds({ remote, disk, path, partition }))

export const fetchFiles = (remote, disk, partition, paths, format) =>
  _call('backupNg.fetchFiles', resolveIds({ remote, disk, format, partition, paths })).then(({ $getFrom: url }) => {
    window.open(`.${url}`)
  })

// -------------------------------------------------------------------

export const probeSrNfs = (host, server, nfsVersion) => _call('sr.probeNfs', { host, nfsVersion, server })

export const probeSrNfsExists = (host, server, serverPath, nfsVersion) =>
  _call('sr.probeNfsExists', { host, nfsVersion, server, serverPath })

export const probeSrIscsiIqns = (host, target, port = undefined, chapUser = undefined, chapPassword) => {
  const params = { host, target }
  port && (params.port = port)
  chapUser && (params.chapUser = chapUser)
  chapPassword && (params.chapPassword = chapPassword)
  return _call('sr.probeIscsiIqns', params)
}

export const probeSrIscsiLuns = (host, target, targetIqn, chapUser = undefined, chapPassword) => {
  const params = { host, target, targetIqn }
  chapUser && (params.chapUser = chapUser)
  chapPassword && (params.chapPassword = chapPassword)
  return _call('sr.probeIscsiLuns', params)
}

export const probeSrIscsiExists = (
  host,
  target,
  targetIqn,
  scsiId,
  port = undefined,
  chapUser = undefined,
  chapPassword
) => {
  const params = { host, target, targetIqn, scsiId }
  port && (params.port = port)
  chapUser && (params.chapUser = chapUser)
  chapPassword && (params.chapPassword = chapPassword)
  return _call('sr.probeIscsiExists', params)
}

export const probeSrHba = host => _call('sr.probeHba', { host })

export const probeSrHbaExists = (host, scsiId) => _call('sr.probeHbaExists', { host, scsiId })

export const probeZfs = host => _call('sr.probeZfs', { host: resolveId(host) })

export const createSrNfs = (
  host,
  nameLabel,
  nameDescription,
  server,
  serverPath,
  nfsVersion = undefined,
  nfsOptions,
  srUuid
) => {
  const params = { host, nameLabel, nameDescription, server, serverPath }
  nfsVersion && (params.nfsVersion = nfsVersion)
  nfsOptions && (params.nfsOptions = nfsOptions)
  srUuid && (params.srUuid = srUuid)
  return _call('sr.createNfs', params)
}

export const createSrSmb = (host, nameLabel, nameDescription, server, user, password, srUuid) => {
  const params = { host, nameLabel, nameDescription, server, user, password }
  if (srUuid !== undefined) {
    params.srUuid = srUuid
  }
  return _call('sr.createSmb', params)
}

export const createSrIscsi = (
  host,
  nameLabel,
  nameDescription,
  target,
  targetIqn,
  scsiId,
  port = undefined,
  chapUser = undefined,
  chapPassword = undefined,
  srUuid
) => {
  const params = { host, nameLabel, nameDescription, target, targetIqn, scsiId }
  port && (params.port = port)
  chapUser && (params.chapUser = chapUser)
  chapPassword && (params.chapPassword = chapPassword)
  srUuid && (params.srUuid = srUuid)
  return _call('sr.createIscsi', params)
}

export const createSrHba = (host, nameLabel, nameDescription, scsiId, srUuid) => {
  const params = { host, nameLabel, nameDescription, scsiId }
  srUuid && (params.srUuid = srUuid)
  return _call('sr.createHba', params)
}

export const createSrIso = (
  host,
  nameLabel,
  nameDescription,
  path,
  type,
  user = undefined,
  password = undefined,
  nfsVersion = undefined,
  nfsOptions = undefined,
  srUuid
) => {
  const params = { host, nameLabel, nameDescription, path, type, srUuid }
  user && (params.user = user)
  password && (params.password = password)
  nfsVersion && (params.nfsVersion = nfsVersion)
  nfsOptions && (params.nfsOptions = nfsOptions)
  srUuid && (params.srUuid = srUuid)
  return _call('sr.createIso', params)
}

export const createSrLvm = (host, nameLabel, nameDescription, device) =>
  _call('sr.createLvm', { host, nameLabel, nameDescription, device })

export const createSrExt = (host, nameLabel, nameDescription, device) =>
  _call('sr.createExt', { host, nameLabel, nameDescription, device })

export const createSrZfs = (host, nameLabel, nameDescription, location) =>
  _call('sr.createZfs', {
    host: resolveId(host),
    nameDescription,
    nameLabel,
    location,
  })

// Job logs ----------------------------------------------------------

export const deleteJobsLogs = async ids => {
  const { length } = ids
  if (length === 0) {
    return
  }
  if (length !== 1) {
    const vars = { nLogs: length }
    try {
      await confirm({
        title: _('logDeleteMultiple', vars),
        body: <p>{_('logDeleteMultipleMessage', vars)}</p>,
      })
    } catch (_) {
      return
    }
  }

  return _call('log.delete', {
    namespace: 'jobs',
    id: ids.map(resolveId),
  })::tap(subscribeJobsLogs.forceRefresh)
}

// Logs

export const deleteApiLog = log =>
  _call('log.delete', { namespace: 'api', id: resolveId(log) })::tap(subscribeApiLogs.forceRefresh)

export const deleteApiLogs = logs =>
  confirm({
    title: _('logDeleteMultiple', { nLogs: logs.length }),
    body: _('logDeleteMultipleMessage', { nLogs: logs.length }),
  }).then(() => Promise.all(map(logs, deleteApiLog)), noop)

// Acls, users, groups ----------------------------------------------------------

export const addAcl = ({ subject, object, action }) =>
  _call('acl.add', resolveIds({ subject, object, action }))::tap(subscribeAcls.forceRefresh, err =>
    error('Add ACL', err.message || String(err))
  )

export const removeAcl = ({ subject, object, action }) =>
  _call('acl.remove', resolveIds({ subject, object, action }))::tap(subscribeAcls.forceRefresh, err =>
    error('Remove ACL', err.message || String(err))
  )

export const removeAcls = acls =>
  confirm({
    title: _('deleteAclsModalTitle', { nAcls: acls.length }),
    body: <p>{_('deleteAclsModalMessage', { nAcls: acls.length })}</p>,
  }).then(
    () =>
      Promise.all(
        map(acls, ({ subject, object, action }) => _call('acl.remove', resolveIds({ subject, object, action })))
      )::tap(subscribeAcls.forceRefresh, err => error('Remove ACLs', err.message || String(err))),
    noop
  )

export const editAcl = (
  { subject, object, action },
  { subject: newSubject = subject, object: newObject = object, action: newAction = action }
) =>
  _call('acl.remove', resolveIds({ subject, object, action }))
    .then(() =>
      _call(
        'acl.add',
        resolveIds({
          subject: newSubject,
          object: newObject,
          action: newAction,
        })
      )
    )
    ::tap(subscribeAcls.forceRefresh, err => error('Edit ACL', err.message || String(err)))

export const createGroup = name =>
  _call('group.create', { name })::tap(subscribeGroups.forceRefresh, err =>
    error(_('createGroup'), err.message || String(err))
  )

export const setGroupName = (group, name) =>
  _call('group.set', resolveIds({ group, name }))::tap(subscribeGroups.forceRefresh)

export const deleteGroup = group =>
  confirm({
    title: _('deleteGroup'),
    body: <p>{_('deleteGroupConfirm')}</p>,
  }).then(
    () =>
      _call('group.delete', resolveIds({ id: group }))::tap(subscribeGroups.forceRefresh, err =>
        error(_('deleteGroup'), err.message || String(err))
      ),
    noop
  )

export const deleteGroups = groups =>
  confirm({
    title: _('deleteGroupsModalTitle', { nGroups: groups.length }),
    body: <p>{_('deleteGroupsModalMessage', { nGroups: groups.length })}</p>,
  }).then(
    () =>
      Promise.all(groups.map(({ id }) => _call('group.delete', { id })))::tap(subscribeGroups.forceRefresh, err =>
        error(_('deleteGroup'), err.message || String(err))
      ),
    noop
  )

export const removeUserFromGroup = (user, group) =>
  _call('group.removeUser', resolveIds({ id: group, userId: user }))::tap(subscribeGroups.forceRefresh, err =>
    error(_('removeUserFromGroup'), err.message || String(err))
  )

export const addUserToGroup = (user, group) =>
  _call('group.addUser', resolveIds({ id: group, userId: user }))::tap(subscribeGroups.forceRefresh, err =>
    error('Add User', err.message || String(err))
  )

export const createUser = (email, password, permission) =>
  _call('user.create', {
    email,
    password,
    permission,
  })::tap(subscribeUsers.forceRefresh, err => error('Create user', err.message || String(err)))

export const deleteUser = user =>
  confirm({
    title: _('deleteUser'),
    body: <p>{_('deleteUserConfirm')}</p>,
  }).then(() =>
    _call('user.delete', {
      id: resolveId(user),
    })::tap(subscribeUsers.forceRefresh, err => error(_('deleteUser'), err.message || String(err)))
  )

export const deleteUsers = users =>
  confirm({
    title: _('deleteUsersModalTitle', { nUsers: users.length }),
    body: <p>{_('deleteUsersModalMessage', { nUsers: users.length })}</p>,
  }).then(
    () =>
      Promise.all(map(resolveIds(users), id => _call('user.delete', { id })))::tap(subscribeUsers.forceRefresh, err =>
        error(_('deleteUser'), err.message || String(err))
      ),
    noop
  )

export const editUser = (user, { email, password, permission }) =>
  _call('user.set', { id: resolveId(user), email, password, permission })::tap(subscribeUsers.forceRefresh)

export const removeUserAuthProvider = ({ userId, authProviderId }) => {
  _call('user.removeAuthProvider', { id: userId, authProvider: authProviderId })
    ::tap(subscribeUsers.forceRefresh)
    .catch(e => {
      error('user.removeAuthProvider', e.message)
    })
}

const _signOutFromEverywhereElse = () =>
  _call('token.deleteOwn', {
    pattern: {
      id: {
        __not: cookies.get('token'),
      },
    },
  })

export const signOutFromEverywhereElse = () =>
  _signOutFromEverywhereElse().then(
    () => success(_('forgetTokens'), _('forgetTokensSuccess')),
    () => error(_('forgetTokens'), _('forgetTokensError'))
  )

export const changePassword = (oldPassword, newPassword) =>
  _call('user.changePassword', {
    oldPassword,
    newPassword,
  })
    .then(_signOutFromEverywhereElse)
    .then(
      () => success(_('pwdChangeSuccess'), _('pwdChangeSuccessBody')),
      () => error(_('pwdChangeError'), _('pwdChangeErrorBody'))
    )

const _setUserPreferences = (preferences, userId) =>
  _call('user.set', {
    id: userId ?? xo.user.id,
    preferences,
  })::tap(subscribeCurrentUser.forceRefresh)

import NewSshKeyModalBody from './new-ssh-key-modal' // eslint-disable-line import/first
export const addSshKey = async key => {
  const { preferences } = xo.user
  const otherKeys = (preferences && preferences.sshKeys) || []

  if (key === undefined) {
    try {
      key = await confirm({
        icon: 'ssh-key',
        title: _('newSshKeyModalTitle'),
        body: <NewSshKeyModalBody />,
      })
    } catch (err) {
      return
    }

    if (!key.title || !key.key) {
      error(_('sshKeyErrorTitle'), _('sshKeyErrorMessage'))
      return
    }
  }

  if (otherKeys.some(otherKey => otherKey.key === key.key)) {
    error(_('sshKeyErrorTitle'), _('sshKeyAlreadyExists'))
    return
  }

  return _setUserPreferences({
    sshKeys: [...otherKeys, key],
  })
}

export const deleteSshKey = key =>
  confirm({
    title: _('deleteSshKeyConfirm'),
    body: _('deleteSshKeyConfirmMessage', {
      title: <strong>{key.title}</strong>,
    }),
  }).then(() => {
    const { preferences } = xo.user
    return _setUserPreferences({
      sshKeys: filter(preferences && preferences.sshKeys, k => k.key !== resolveId(key)),
    })
  }, noop)

// eslint-disable-next-line import/first
import { AddOtpModal } from './add-otp-modal.js'
export const addOtp = async secret => {
  try {
    let token
    do {
      token = await confirm({
        title: _('addOtpConfirm'),
        body: <AddOtpModal failedToken={token} secret={secret} user={xo.user} />,
      })
    } while (!(await authenticator.check(token, secret)))
  } catch (error) {
    if (error === undefined) {
      // action canceled
      return
    }
    throw error
  }

  return _setUserPreferences({
    otp: secret,
  })
}

export const removeOtp = user =>
  confirm({
    title: _('removeOtpConfirm'),
    body: _('removeOtpConfirmMessage'),
  }).then(
    () =>
      _setUserPreferences(
        {
          otp: null,
        },
        resolveId(user)
      ),
    noop
  )

export const deleteSshKeys = keys =>
  confirm({
    title: _('deleteSshKeysConfirm', { nKeys: keys.length }),
    body: _('deleteSshKeysConfirmMessage', {
      nKeys: keys.length,
    }),
  }).then(() => {
    const { preferences } = xo.user
    const keyIds = resolveIds(keys)
    return _setUserPreferences({
      sshKeys: filter(preferences && preferences.sshKeys, sshKey => !includes(keyIds, sshKey.key)),
    })
  }, noop)

export const addAuthToken = async () => {
  const { description, expiration } = await confirm({
    body: <NewAuthTokenModal />,
    icon: 'user',
    title: _('newAuthTokenModalTitle'),
  })
  const expires = new Date(expiration).setHours(23, 59, 59)
  return _call('token.create', {
    description,
    expiresIn: Number.isNaN(expires) ? undefined : expires - new Date().getTime(),
  })::tap(subscribeUserAuthTokens.forceRefresh)
}

export const deleteAuthToken = async ({ id }) => {
  await confirm({
    body: _('deleteAuthTokenConfirmMessage', {
      id,
    }),
    icon: 'user',
    title: _('deleteAuthTokenConfirm'),
  })
  return _call('token.deleteOwn', { tokens: [id] })::tap(subscribeUserAuthTokens.forceRefresh)
}

export const deleteAuthTokens = async tokens => {
  await confirm({
    body: _('deleteAuthTokensConfirmMessage', {
      nTokens: tokens.length,
    }),
    icon: 'user',
    title: _('deleteAuthTokensConfirm', { nTokens: tokens.length }),
  })
  return _call('token.deleteOwn', { tokens: tokens.map(token => token.id) })::tap(subscribeUserAuthTokens.forceRefresh)
}

export const editAuthToken = ({ description, id }) =>
  _call('token.set', {
    description,
    id,
  })::tap(subscribeUserAuthTokens.forceRefresh)

export const editXsCredentials = xsCredentials =>
  _setUserPreferences({
    xsCredentials,
  })

// User filters --------------------------------------------------

import AddUserFilterModalBody from './add-user-filter-modal' // eslint-disable-line import/first
export const addCustomFilter = (type, value) => {
  const { user } = xo
  return confirm({
    title: _('saveNewFilterTitle'),
    body: <AddUserFilterModalBody user={user} type={type} value={value} />,
  }).then(name => {
    if (name.length === 0) {
      return error(_('saveNewUserFilterErrorTitle'), _('saveNewUserFilterErrorBody'))
    }

    const { preferences } = user
    const filters = (preferences && preferences.filters) || {}

    return _setUserPreferences({
      filters: {
        ...filters,
        [type]: {
          ...filters[type],
          [name]: value,
        },
      },
    })
  })
}

export const removeCustomFilter = (type, name) =>
  confirm({
    title: _('removeUserFilterTitle'),
    body: <p>{_('removeUserFilterBody')}</p>,
  }).then(() => {
    const { user } = xo
    const { filters } = user.preferences

    return _setUserPreferences({
      filters: {
        ...filters,
        [type]: {
          ...filters[type],
          [name]: undefined,
        },
      },
    })
  })

export const editCustomFilter = (type, name, { newName = name, newValue }) => {
  const { filters } = xo.user.preferences
  return _setUserPreferences({
    filters: {
      ...filters,
      [type]: {
        ...filters[type],
        [name]: undefined,
        [newName]: newValue || filters[type][name],
      },
    },
  })
}

export const setDefaultHomeFilter = (type, name) => {
  const { user } = xo
  const { preferences } = user
  const defaultFilters = (preferences && preferences.defaultHomeFilters) || {}

  return _setUserPreferences({
    defaultHomeFilters: {
      ...defaultFilters,
      [type]: name === null ? undefined : name,
    },
  })
}

// IP pools --------------------------------------------------------------------

export const createIpPool = ({ name, ips, networks }) => {
  const addresses = {}
  forEach(ips, ip => {
    addresses[ip] = {}
  })
  return _call('ipPool.create', {
    name,
    addresses,
    networks: resolveIds(networks),
  })::tap(subscribeIpPools.forceRefresh)
}

export const deleteIpPool = ipPool =>
  _call('ipPool.delete', { id: resolveId(ipPool) })::tap(subscribeIpPools.forceRefresh)

export const setIpPool = (ipPool, { name, addresses, networks }) =>
  _call('ipPool.set', {
    id: resolveId(ipPool),
    name,
    addresses,
    networks: resolveIds(networks),
  })::tap(subscribeIpPools.forceRefresh)

// Cloud configs --------------------------------------------------------------------

export const subscribeCloudConfigs = createSubscription(() => _call('cloudConfig.getAll'))

export const createCloudConfig = props => _call('cloudConfig.create', props)::tap(subscribeCloudConfigs.forceRefresh)

export const deleteCloudConfigs = ids => {
  const { length } = ids
  if (length === 0) {
    return
  }

  const vars = { nCloudConfigs: length }
  return confirm({
    title: _('confirmDeleteCloudConfigsTitle', vars),
    body: <p>{_('confirmDeleteCloudConfigsBody', vars)}</p>,
  }).then(
    () =>
      Promise.all(ids.map(id => _call('cloudConfig.delete', { id: resolveId(id) })))::tap(
        subscribeCloudConfigs.forceRefresh
      ),
    noop
  )
}

export const editCloudConfig = (cloudConfig, props) =>
  _call('cloudConfig.update', { ...props, id: resolveId(cloudConfig) })::tap(subscribeCloudConfigs.forceRefresh)

export const subscribeNetworkConfigs = createSubscription(() => _call('cloudConfig.getAllNetworkConfigs'))

export const createNetworkConfig = props =>
  _call('cloudConfig.createNetworkConfig', props)::tap(subscribeNetworkConfigs.forceRefresh)

export const deleteNetworkConfigs = ids => {
  const { length } = ids
  if (length === 0) {
    return
  }

  const vars = { nNetworkConfigs: length }
  return confirm({
    title: _('confirmDeleteNetworkConfigsTitle', vars),
    body: <p>{_('confirmDeleteNetworkConfigsBody', vars)}</p>,
  }).then(
    () =>
      Promise.all(ids.map(id => _call('cloudConfig.delete', { id: resolveId(id) })))::tap(
        subscribeNetworkConfigs.forceRefresh
      ),
    noop
  )
}

export const editNetworkConfig = (networkConfig, props) =>
  _call('cloudConfig.update', { ...props, id: resolveId(networkConfig) })::tap(subscribeNetworkConfigs.forceRefresh)

// XO SAN ----------------------------------------------------------------------

export const getVolumeInfo = (xosanSr, infoType) => _call('xosan.getVolumeInfo', { sr: xosanSr, infoType })

export const createXosanSR = ({
  template,
  pif,
  vlan,
  srs,
  glusterType,
  redundancy,
  brickSize,
  memorySize,
  ipRange,
}) => {
  const promise = _call('xosan.createSR', {
    template,
    pif: pif.id,
    vlan: String(vlan),
    srs: resolveIds(srs),
    glusterType,
    redundancy: Number.parseInt(redundancy),
    brickSize,
    memorySize,
    ipRange,
  })

  // Force refresh in parallel to get the creation progress sooner
  subscribeCheckSrCurrentState.forceRefresh()

  return promise
}

export const addXosanBricks = (xosansr, lvmsrs, brickSize) => _call('xosan.addBricks', { xosansr, lvmsrs, brickSize })

export const replaceXosanBrick = (xosansr, previousBrick, newLvmSr, brickSize, onSameVM = false) =>
  _call('xosan.replaceBrick', resolveIds({ xosansr, previousBrick, newLvmSr, brickSize, onSameVM }))

export const removeXosanBricks = (xosansr, bricks) => _call('xosan.removeBricks', { xosansr, bricks })

export const computeXosanPossibleOptions = (lvmSrs, brickSize) =>
  _call('xosan.computeXosanPossibleOptions', { lvmSrs, brickSize })

export const registerXosan = () =>
  _call('cloud.registerResource', { namespace: 'xosan' })::tap(subscribeResourceCatalog.forceRefresh)

export const fixHostNotInXosanNetwork = (xosanSr, host) => _call('xosan.fixHostNotInNetwork', { xosanSr, host })

// XOSAN packs -----------------------------------------------------------------

export const getResourceCatalog = ({ filters } = {}) => _call('cloud.getResourceCatalog', { filters })

export const getAllResourceCatalog = () => _call('cloud.getAllResourceCatalog')

const downloadAndInstallXosanPack = (pack, pool, { version }) =>
  _call('xosan.downloadAndInstallXosanPack', {
    id: resolveId(pack),
    version,
    pool: resolveId(pool),
  })

export const downloadAndInstallResource = ({ namespace, id, version, sr }) =>
  _call('cloud.downloadAndInstallResource', {
    namespace,
    id,
    version,
    sr: resolveId(sr),
  })

import UpdateXosanPacksModal from './update-xosan-packs-modal' // eslint-disable-line import/first
export const updateXosanPacks = pool =>
  confirm({
    title: _('xosanUpdatePacks'),
    icon: 'host-patch-update',
    body: <UpdateXosanPacksModal pool={pool} />,
  }).then(pack => {
    if (pack === undefined) {
      return
    }

    return downloadAndInstallXosanPack(pack, pool, { version: pack.version })
  })

// XOSTOR   --------------------------------------------------------------------

export const createXostorSr = params => _call('xostor.create', params)

export const destroyXostorInterfaces = async (sr, ifaceNames) => {
  const srId = resolveId(sr)
  await Promise.all(ifaceNames.map(ifaceName => _call('xostor.destroyInterface', { sr: srId, name: ifaceName })))::tap(
    () => subscribeXostorInterfaces.forceRefresh(sr)
  )
}

export const createXostorInterface = async sr => {
  const { interfaceName, networkId } = await form({
    render: props => <NetworkCard {...props} insideModalForm sr={sr} />,
    defaultValue: {
      interfaceName: '',
      networkId: undefined,
    },
    header: (
      <span>
        <Icon icon='add' /> {_('createInterface')}
      </span>
    ),
  })

  await _call('xostor.createInterface', { sr: resolveId(sr), network: networkId, name: interfaceName })::tap(() =>
    subscribeXostorInterfaces.forceRefresh(sr)
  )
}
export const setXostor = (sr, params) => _call('xostor.set', { sr: resolveId(sr), ...params })

// Licenses --------------------------------------------------------------------

export const getLicenses = ({ productType } = {}) => _call('xoa.licenses.getAll', { productType })

export const getLicense = (productId, boundObjectId) => _call('xoa.licenses.get', { productId, boundObjectId })

export const unlockXosan = (licenseId, srId) => _call('xosan.unlock', { licenseId, sr: srId })

export const bindLicense = (licenseId, boundObjectId) => _call('xoa.licenses.bind', { licenseId, boundObjectId })

export const rebindObjectLicense = (boundObjectId, licenseId, productId) =>
  _call('xoa.licenses.rebindObject', { boundObjectId, licenseId, productId })

export const bindXcpngLicense = (licenseId, boundObjectId) =>
  bindLicense(licenseId, boundObjectId)::tap(subscribeXcpngLicenses.forceRefresh)

export const rebindLicense = (licenseType, licenseId, oldBoundObjectId, newBoundObjectId) =>
  _call('xoa.licenses.rebind', { licenseId, oldBoundObjectId, newBoundObjectId })::tap(() => {
    if (licenseType === 'xcpng-standard' || licenseType === 'xcpng-enterprise') {
      return subscribeXcpngLicenses.forceRefresh()
    }
  })

export const selfBindLicense = ({ id, plan, oldXoaId }) =>
  confirm({
    title: _('bindXoaLicense'),
    body: _('bindXoaLicenseConfirm'),
    strongConfirm: {
      messageId: 'bindXoaLicenseConfirmText',
      values: { licenseType: plan },
    },
    icon: 'unlock',
  })
    .then(() => _call('xoa.licenses.bindToSelf', { licenseId: id, oldXoaId }), noop)
    ::tap(subscribeSelfLicenses.forceRefresh)

export const subscribeSelfLicenses = createSubscription(() => _call('xoa.licenses.getSelf'))

const createLicenseSubscription = productType =>
  createSubscription(() =>
    getXoaPlan() !== SOURCES && store.getState().user.permission === 'admin'
      ? _call('xoa.licenses.getAll', { productType })
      : undefined
  )

export const subscribeXcpngLicenses = createLicenseSubscription('xcpng')

export const subscribeXostorLicenses = createLicenseSubscription('xostor')

// Support --------------------------------------------------------------------

export const clearXoaCheckCache = () => _call('xoa.clearCheckCache')

export const checkXoa = () => _call('xoa.check')

export const closeTunnel = () => _call('xoa.supportTunnel.close')::tap(subscribeTunnelState.forceRefresh)

export const openTunnel = () =>
  _call('xoa.supportTunnel.open')::tap(() => {
    subscribeTunnelState.forceRefresh()
    // After 1s, we most likely got the tunnel ID
    // and we don't want to wait another 5s to show it to the user.
    setTimeout(subscribeTunnelState.forceRefresh, 1000)
  })

export const subscribeTunnelState = createSubscription(() => _call('xoa.supportTunnel.getState'))

export const getApplianceInfo = () => _call('xoa.getApplianceInfo')

export const getApiApplianceInfo = () => fetch('./rest/v0/appliance').then(resp => resp.json())

export const restartXoServer = async () => {
  await confirm({
    icon: 'restart',
    title: _('restartXoServer'),
    body: _('restartXoServerConfirm'),
    strongConfirm: {
      messageId: 'restartXoServer',
    },
  })

  await _call('xoa.restartXoServer')
}

// Proxy --------------------------------------------------------------------

export const getAllProxies = () => _call('proxy.getAll')

export const createProxyTrialLicense = () => _call('xoa.licenses.createProxyTrial')

export const deployProxyAppliance = (license, sr, { network, proxy, ...props } = {}) =>
  _call('proxy.deploy', {
    license: resolveId(license),
    network: resolveId(network),
    proxy: resolveId(proxy),
    sr: resolveId(sr),
    ...props,
  })::tap(subscribeProxies.forceRefresh)

export const registerProxy = async () => {
  const getStringOrUndefined = string => (string.trim() === '' ? undefined : string)

  const { address, authenticationToken, name, vmUuid } = await confirm({
    body: <RegisterProxyModal />,
    icon: 'connect',
    title: _('registerProxy'),
  })

  const proxyId = await registerProxyApplicance({
    address: getStringOrUndefined(address),
    authenticationToken: getStringOrUndefined(authenticationToken),
    name: getStringOrUndefined(name),
    vmUuid: getStringOrUndefined(vmUuid),
  })
  const _isProxyWorking = await isProxyWorking(proxyId).catch(err => {
    console.error('isProxyWorking error:', err)
    return false
  })
  if (!_isProxyWorking) {
    await confirm({
      body: _('proxyConnectionFailedAfterRegistrationMessage'),
      title: _('proxyError'),
    })
    await forgetProxyAppliances([proxyId])
  }
}

export const registerProxyApplicance = proxyInfo =>
  _call('proxy.register', proxyInfo)::tap(subscribeProxies.forceRefresh)

export const editProxyAppliance = (proxy, { vm, ...props }) =>
  _call('proxy.update', {
    id: resolveId(proxy),
    vm: resolveId(vm),
    ...props,
  })::tap(subscribeProxies.forceRefresh)

const _forgetProxyAppliance = proxy => _call('proxy.unregister', { id: resolveId(proxy) })
export const forgetProxyAppliances = proxies =>
  confirm({
    title: _('forgetProxyApplianceTitle', { n: proxies.length }),
    body: _('forgetProxyApplianceMessage', { n: proxies.length }),
  }).then(() => Promise.all(map(proxies, _forgetProxyAppliance))::tap(subscribeProxies.forceRefresh))

const _destroyProxyAppliance = proxy => _call('proxy.destroy', { id: resolveId(proxy) })
export const destroyProxyAppliances = proxies =>
  confirm({
    title: _('destroyProxyApplianceTitle', { n: proxies.length }),
    body: _('destroyProxyApplianceMessage', { n: proxies.length }),
  }).then(() => Promise.all(map(proxies, _destroyProxyAppliance))::tap(subscribeProxies.forceRefresh))

export const upgradeProxyAppliance = (proxy, props) =>
  _call('proxy.upgradeAppliance', { id: resolveId(proxy), ...props })

export const openTunnelOnProxy = async proxy => {
  const result = await _call('proxy.openSupportTunnel', { id: resolveId(proxy) }).catch(err => err.message)
  await alert(_('supportTunnel'), <pre>{result}</pre>)
}

export const getProxyApplianceUpdaterState = id => _call('proxy.getApplianceUpdaterState', { id })

export const updateProxyApplianceSettings = (id, props) => _call('proxy.updateApplianceSettings', { id, ...props })

const PROXY_HEALTH_CHECK_COMMON_ERRORS_CODE = new Set([
  'ECONNREFUSED',
  'ECONNRESET',
  'EHOSTUNREACH',
  'ENOTFOUND',
  'ETIMEDOUT',
])

export const checkProxyHealth = async proxy => {
  const result = await _call('proxy.checkHealth', {
    id: resolveId(proxy),
  })
  return result.success
    ? success(
        <span>
          <Icon icon='success' /> {_('proxyTestSuccess', { name: proxy.name })}
        </span>,
        _('proxyTestSuccessMessage')
      )
    : error(
        <span>
          <Icon icon='error' /> {_('proxyTestFailed', { name: proxy.name })}
        </span>,
        <span>
          {PROXY_HEALTH_CHECK_COMMON_ERRORS_CODE.has(result.error.code)
            ? _('proxyTestFailedConnectionIssueMessage')
            : result.error.message}
        </span>
      )
}

export const isProxyWorking = async proxy => (await _call('proxy.checkHealth', { id: resolveId(proxy) })).success

// Audit plugin ---------------------------------------------------------

const METHOD_NOT_FOUND_CODE = -32601
export const fetchAuditRecords = async () => {
  try {
    const { $getFrom } = await _call('audit.getRecords', { ndjson: true })
    const response = await fetch(`.${$getFrom}`)
    const data = await response.text()

    const records = []
    parseNdJson(data, record => {
      records.push(record)
    })
    return records
  } catch (error) {
    if (error.code === METHOD_NOT_FOUND_CODE) {
      return []
    }
    throw error
  }
}

export const exportAuditRecords = () =>
  _call('audit.exportRecords').then(({ $getFrom: url }) => {
    window.open(`.${url}`)
  })

export const importAuditRecords = async recordsFile => {
  const { $sendTo } = await _call('audit.importRecords', { zipped: recordsFile.type === 'application/gzip' })
  const response = await post($sendTo, recordsFile)
  const text = await response.text()

  if (response.status !== 200) {
    throw new Error(text)
  }

  try {
    return JSON.parse(text)
  } catch (error) {
    throw new Error(`Body is not a JSON, original message is : ${text}`)
  }
}

export const checkAuditRecordsIntegrity = (oldest, newest) => _call('audit.checkIntegrity', { oldest, newest })

export const generateAuditFingerprint = oldest => _call('audit.generateFingerprint', { oldest })

// LDAP ------------------------------------------------------------------------

export const synchronizeLdapGroups = () =>
  confirm({
    title: _('syncLdapGroups'),
    body: _('syncLdapGroupsWarning'),
    icon: 'refresh',
  }).then(() => _call('ldap.synchronizeGroups')::tap(subscribeGroups.forceRefresh), noop)

// Netbox plugin ---------------------------------------------------------------

export const synchronizeNetbox = pools =>
  confirm({
    title: _('syncNetbox'),
    body: _('syncNetboxWarning'),
    icon: 'refresh',
  }).then(() => _call('netbox.synchronize', { pools: resolveIds(pools) }))

// ESXi import ---------------------------------------------------------------

export const esxiListVms = (host, user, password, sslVerify) =>
  _call('esxi.listVms', { host, user, password, sslVerify })

export const importVmsFromEsxi = params => _call('vm.importMultipleFromEsxi', params)

// Github API ---------------------------------------------------------------
const _callGithubApi = async (endpoint = '') => {
  const url = new URL('https://api.github.com/repos/vatesfr/xen-orchestra')
  url.pathname += endpoint
  const resp = await fetch(url.toString())
  const json = await resp.json()
  if (resp.ok) {
    return json
  } else {
    throw new Error(json.message)
  }
}

export const getMasterCommit = () => _callGithubApi('/commits/master')

export const compareCommits = (base, head) => _callGithubApi(`/compare/${base}...${head}`)
