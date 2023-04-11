import fromCallback from 'promise-toolbox/fromCallback'
import getStream from 'get-stream'
import humanFormat from 'human-format'
import React from 'react'
import ReadableStream from 'readable-stream'
import xml2js from 'xml2js'
import { connect } from 'react-redux'
import { createPredicate } from 'value-matcher'
import { FormattedDate } from 'react-intl'
import {
  clone,
  every,
  forEach,
  get,
  isEmpty,
  isFunction,
  isPlainObject,
  map,
  mapValues,
  omit,
  pick,
  sample,
  some,
} from 'lodash'

import _ from './intl'
import * as actions from './store/actions'
import invoke from './invoke'
import store from './store'
import { getObject, isAdmin } from './selectors'
import { satisfies as versionSatisfies } from 'semver'

export const EMPTY_ARRAY = Object.freeze([])
export const EMPTY_OBJECT = Object.freeze({})

export const VIRTUALIZATION_MODE_LABEL = {
  hvm: 'hardwareVirtualizedMode',
  pv: 'paraVirtualizedMode',
  pvhvm: 'hvmModeWithPvDriversEnabled',
  pv_in_pvh: 'pvInPvhMode',
}

// ===================================================================

export addSubscriptions from './add-subscriptions'

// ===================================================================

export const getVirtualizationModeLabel = vm => {
  const virtualizationMode = vm.virtualizationMode === 'hvm' && vm.pvDriversDetected ? 'pvhvm' : vm.virtualizationMode
  const messageId = VIRTUALIZATION_MODE_LABEL[virtualizationMode]

  return messageId === undefined ? virtualizationMode : _(messageId)
}

// ===================================================================

export const ensureArray = value => {
  if (value === undefined) {
    return []
  }

  return Array.isArray(value) ? value : [value]
}

export const propsEqual = (o1, o2, props) => {
  props = ensureArray(props)

  for (const prop of props) {
    if (o1[prop] !== o2[prop]) {
      return false
    }
  }

  return true
}

// ===================================================================

const _normalizeMapStateToProps = mapper => {
  // accept a list of entries to extract from the state
  if (Array.isArray(mapper)) {
    return state => pick(state, mapper)
  }

  if (typeof mapper === 'function') {
    const factoryOrMapper = (state, props) => {
      const result = mapper(state, props)

      // Properly handles factory pattern.
      if (typeof result === 'function') {
        mapper = result
        return factoryOrMapper
      }

      if (isPlainObject(result)) {
        if (isEmpty(result)) {
          // Nothing can be determined, wait for it.
          return result
        }

        if (every(result, isFunction)) {
          indirection = (state, props) => mapValues(result, selector => selector(state, props))
          return indirection(state, props)
        }
      }

      indirection = mapper
      return result
    }

    let indirection = factoryOrMapper
    return (state, props) => indirection(state, props)
  }

  mapper = mapValues(mapper, _normalizeMapStateToProps)
  return (state, props) => mapValues(mapper, fn => fn(state, props))
}

export const connectStore = (mapStateToProps, opts = {}) => {
  const connector = connect(_normalizeMapStateToProps(mapStateToProps), actions, undefined, opts)

  return Component => {
    const ConnectedComponent = connector(Component)

    if (opts.withRef && 'value' in Component.prototype) {
      Object.defineProperty(ConnectedComponent.prototype, 'value', {
        configurable: true,
        get() {
          return this.getWrappedInstance().value
        },
        set(value) {
          this.getWrappedInstance().value = value
        },
      })
    }

    return ConnectedComponent
  }
}

// -------------------------------------------------------------------

export { default as Debug } from './debug'

// -------------------------------------------------------------------

// Returns the current XOA Plan or the Plan name if number given
/**
 * @deprecated
 *
 * Use `getXoaPlan` from `xoa-plans` instead
 */
export const getXoaPlan = plan => {
  switch (plan || +process.env.XOA_PLAN) {
    case 1:
      return 'Free'
    case 2:
      return 'Starter'
    case 3:
      return 'Enterprise'
    case 4:
      return 'Premium'
    case 5:
      return 'Community'
  }
  return 'Unknown'
}

// -------------------------------------------------------------------

export const mapPlus = (collection, cb) => {
  const result = []
  const push = ::result.push
  forEach(collection, (value, index) => cb(value, push, index))
  return result
}

// -------------------------------------------------------------------

export const noop = () => {}

// -------------------------------------------------------------------

export const osFamily = invoke(
  {
    centos: ['centos'],
    debian: ['debian'],
    docker: ['coreos'],
    fedora: ['fedora'],
    freebsd: ['freebsd'],
    gentoo: ['gentoo'],
    'linux-mint': ['linux-mint'],
    netbsd: ['netbsd'],
    oracle: ['oracle'],
    osx: ['osx'],
    redhat: ['redhat', 'rhel'],
    solaris: ['solaris'],
    suse: ['sles', 'suse', 'opensuse-leap', 'opensuse-microos'],
    ubuntu: ['ubuntu'],
    windows: ['windows'],
  },
  osByFamily => {
    const osToFamily = Object.create(null)
    forEach(osByFamily, (list, family) => {
      forEach(list, os => {
        osToFamily[os] = family
      })
    })

    return osName => osName && osToFamily[osName.toLowerCase()]
  }
)

// -------------------------------------------------------------------

function safeHumanFormat(value, opts) {
  try {
    return humanFormat(value, opts)
  } catch (error) {
    console.error('humanFormat', value, opts, error)
    return 'N/D'
  }
}

export const formatLogs = logs =>
  Promise.all(
    map(logs, ({ body }, id) => {
      const matches = /^value:\s*([0-9.]+)\s+config:\s*([^]*)$/.exec(body)
      if (matches === null) {
        return
      }

      const [, value, xml] = matches
      return fromCallback(xml2js.parseString, xml).then((result = {}) => {
        const object = mapValues(result.variable, value => get(value, '[0].$.value'))
        if (object.name === undefined) {
          return
        }

        const { name, ...alarmAttributes } = object

        return { name, value, alarmAttributes, id }
      }, noop)
    })
  )

export const formatSize = bytes => (bytes != null ? safeHumanFormat(bytes, { scale: 'binary', unit: 'B' }) : 'N/D')

export const formatSizeShort = bytes => safeHumanFormat(bytes, { scale: 'binary', unit: 'B', maxDecimals: 'auto' })

export const formatSizeRaw = bytes => humanFormat.raw(bytes, { scale: 'binary', unit: 'B' })

export const formatSpeed = (bytes, milliseconds) =>
  safeHumanFormat((bytes * 1e3) / milliseconds, {
    scale: 'binary',
    unit: 'B/s',
  })

const timeScale = new humanFormat.Scale({
  ns: 1e-6,
  µs: 1e-3,
  ms: 1,
  s: 1e3,
  min: 60 * 1e3,
  h: 3600 * 1e3,
  d: 86400 * 1e3,
  y: 2592000 * 1e3,
})
export const formatTime = milliseconds => safeHumanFormat(milliseconds, { scale: timeScale, decimals: 0 })

export const parseSize = size => {
  let bytes = humanFormat.parse.raw(size, { scale: 'binary' })
  if (bytes.unit && bytes.unit !== 'B') {
    bytes = humanFormat.parse.raw(size)

    if (bytes.unit && bytes.unit !== 'B') {
      throw new Error('invalid size: ' + size)
    }
  }
  return Math.floor(bytes.value * bytes.factor)
}

// -------------------------------------------------------------------

const NotFound = () => <h1>{_('errorPageNotFound')}</h1>

// Decorator to declare routes on a component.
//
// TODO: add support for function childRoutes (getChildRoutes).
export const routes = (indexRoute, childRoutes) => target => {
  if (Array.isArray(indexRoute)) {
    childRoutes = indexRoute
    indexRoute = undefined
  } else if (typeof indexRoute === 'function') {
    indexRoute = {
      component: indexRoute,
    }
  } else if (typeof indexRoute === 'string') {
    indexRoute = {
      onEnter: invoke(indexRoute, pathname => (state, replace) => {
        const current = state.location.pathname
        replace((current === '/' ? '' : current) + '/' + pathname)
      }),
    }
  }

  if (isPlainObject(childRoutes)) {
    childRoutes = map(childRoutes, (component, path) => {
      // The logic can be bypassed by passing a plain object.
      if (isPlainObject(component)) {
        return { ...component, path }
      }

      return { ...component.route, component, path }
    })
  }

  if (childRoutes) {
    childRoutes.push({ component: NotFound, path: '*' })
  }

  target.route = {
    indexRoute,
    childRoutes,
  }

  return target
}

// -------------------------------------------------------------------

// Creates a new function which throws an error.
//
// ```js
// promise.catch(throwFn('an error has occurred'))
//
// function foo (param = throwFn('param is required')) {}
// ```
export const throwFn = error => () => {
  throw typeof error === 'string' ? new Error(error) : error
}

// ===================================================================

export const resolveResourceSet = resourceSet => {
  if (!resourceSet) {
    return
  }

  const { objects, ipPools, ...attrs } = resourceSet
  const resolvedObjects = {}
  const resolvedSet = {
    ...attrs,
    missingObjects: [],
    objectsByType: resolvedObjects,
    ipPools,
  }
  const state = store.getState()

  forEach(objects, id => {
    const object = getObject(state, id, true) // true: useResourceSet to bypass permissions

    // Error, missing resource.
    if (!object) {
      resolvedSet.missingObjects.push(id)
      return
    }

    const { type } = object

    if (!resolvedObjects[type]) {
      resolvedObjects[type] = [object]
    } else {
      resolvedObjects[type].push(object)
    }
  })

  return resolvedSet
}

export const resolveResourceSets = resourceSets => map(resourceSets, resolveResourceSet)

// ===================================================================

export const streamToString = getStream

// ===================================================================

/* global FileReader */

// Creates a readable stream from a HTML file.
export const htmlFileToStream = file => {
  const reader = new FileReader()
  const stream = new ReadableStream()
  let offset = 0

  reader.onloadend = evt => {
    stream.push(evt.target.result)
  }
  reader.onerror = error => {
    stream.emit('error', error)
  }

  stream._read = function (size) {
    if (offset >= file.size) {
      stream.push(null)
    } else {
      reader.readAsBinaryString(file.slice(offset, offset + size))
      offset += size
    }
  }

  return stream
}

// ===================================================================

export const resolveId = value => (value != null && typeof value === 'object' && 'id' in value ? value.id : value)

export const resolveIds = params => {
  for (const key in params) {
    const param = params[key]
    if (param != null && typeof param === 'object' && 'id' in param) {
      params[key] = param.id
    }
  }
  return params
}

// ===================================================================

const OPs = {
  '<': a => a < 0,
  '<=': a => a <= 0,
  '===': a => a === 0,
  '>': a => a > 0,
  '>=': a => a >= 0,
}

const makeNiceCompare = compare =>
  function () {
    const { length } = arguments
    if (length === 2) {
      return compare(arguments[0], arguments[1])
    }

    let i = 1
    let v1 = arguments[0]
    let op, v2
    while (i < length) {
      op = arguments[i++]
      v2 = arguments[i++]
      if (!OPs[op](compare(v1, v2))) {
        return false
      }
      v1 = v2
    }
    return true
  }

export const compareVersions = makeNiceCompare((v1, v2) => {
  v1 = v1.split('.')
  v2 = v2.split('.')

  for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
    const n1 = +v1[i] || 0
    const n2 = +v2[i] || 0

    if (n1 < n2) return -1
    if (n1 > n2) return 1
  }

  return 0
})

export const isXosanPack = ({ name }) => name.startsWith('XOSAN')

// ===================================================================

// Generates a random human-readable string of length `length`
// Useful to generate random default names intended for the UI user
export const generateReadableRandomString = (() => {
  const CONSONANTS = 'bdfgklmnprtvz'.split('')
  const VOWELS = 'aeiou'.split('')
  return (length = 8) => {
    const result = new Array(length)
    for (let i = 0; i < length; ++i) {
      result[i] = sample((i & 1) === 0 ? VOWELS : CONSONANTS)
    }
    return result.join('')
  }
})()

export const cowSet = (object, path, value, depth = 0) => {
  if (depth >= path.length) {
    return value
  }

  object = object != null ? clone(object) : {}
  const prop = path[depth]
  object[prop] = cowSet(object[prop], path, value, depth + 1)
  return object
}

// Generates a function that returns a value between 0 and 1
// This function returns an estimated progress value between 0 and 1
// based on the elapsed time since the createFakeProgress call and
// the given estimated duration d
//
// const getProgress = createFakeProgress(120)
// setInterval(() => console.log(`Progress: ${getProgress() * 100} %`), 1000)
export const createFakeProgress = (() => {
  const S = 0.95 // Progress value after d seconds
  return d => {
    const startTime = Date.now() / 1e3
    return () => {
      const x = Date.now() / 1e3 - startTime
      return -Math.exp((x * Math.log(1 - S)) / d) + 1
    }
  }
})()

export const NumericDate = ({ timestamp }) => (
  <FormattedDate day='2-digit' hour='numeric' minute='numeric' month='2-digit' value={timestamp} year='numeric' />
)

export const ShortDate = ({ timestamp }) => (
  <FormattedDate value={timestamp} month='short' day='numeric' year='numeric' />
)

export const findLatestPack = (packs, hostsVersions) => {
  const checkVersion = version =>
    !version || every(hostsVersions, hostVersion => versionSatisfies(hostVersion, version))

  let latestPack = { version: '0' }
  forEach(packs, pack => {
    if (
      pack.type === 'iso' &&
      compareVersions(pack.version, '>', latestPack.version) &&
      checkVersion(pack.requirements && pack.requirements.xenserver)
    ) {
      latestPack = pack
    }
  })

  if (latestPack.version === '0') {
    // No compatible pack was found
    return
  }

  return latestPack
}

export const isLatestXosanPackInstalled = (latestXosanPack, hosts) =>
  latestXosanPack !== undefined &&
  every(hosts, host =>
    some(host.supplementalPacks, ({ name, version }) => name === 'XOSAN' && version === latestXosanPack.version)
  )

// ===================================================================

export const getMemoryUsedMetric = ({ memory, memoryFree = memory }) =>
  map(memory, (value, key) => value - memoryFree[key])

// ===================================================================

export const generateRandomId = () => Math.random().toString(36).slice(2)

// ===================================================================

// it returns [nActivePaths, nPaths]
export const getIscsiPaths = pbd => {
  const pathsInfo = pbd.otherConfig[`mpath-${pbd.device_config.SCSIid}`]
  return pathsInfo !== undefined ? JSON.parse(pathsInfo) : []
}

// ===================================================================

export const createBlobFromString = str =>
  new window.Blob([str], {
    type: 'text/plain',
  })

// ===================================================================

// Format a date in ISO 8601 in a safe way to be used in filenames
// (even on Windows).
export const safeDateFormat = ms => new Date(ms).toISOString().replace(/:/g, '_')

// ===================================================================

export const downloadLog = ({ log, date, type }) => {
  const isJson = typeof log !== 'string'

  const anchor = document.createElement('a')
  anchor.href = window.URL.createObjectURL(createBlobFromString(isJson ? JSON.stringify(log, null, 2) : log))
  anchor.download = `${safeDateFormat(date)} - ${type}.${isJson ? 'json' : 'log'}`
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
}

// ===================================================================

// Creates compare function based on different criterias
//
// ```js
// [{ name: 'bar', value: v2 }, { name: 'foo', value: v1 }].sort(
//   createCompare([
//     o => o.value === v1,
//     'name'
//   ])
// )
// ```
export const createCompare =
  criterias =>
  (...items) => {
    let res = 0
    // Array.find to stop when the result is != 0
    criterias.find(fn => {
      const [v1, v2] = items.map(item => {
        const v = typeof fn === 'string' ? item[fn] : fn(item)
        return v === true ? -1 : v === false ? 1 : v
      })
      return (res = v1 < v2 ? -1 : v1 > v2 ? 1 : 0)
    })
    return res
  }

// ===================================================================

export const createCompareContainers = poolId => createCompare([c => c.$pool === poolId, c => c.type === 'pool'])

// ===================================================================

export const hasLicenseRestrictions = host => {
  const licenseType = host.license_params.sku_type
  return (
    host.productBrand !== 'XCP-ng' &&
    versionSatisfies(host.version, '>=7.3.0') &&
    (licenseType === 'free' || licenseType === 'express')
  )
}

// ===================================================================

export const adminOnly = Component =>
  connectStore({
    _isAdmin: isAdmin,
  })(({ _isAdmin, ...props }) => (_isAdmin ? <Component {...props} /> : <NotFound />))

// ===================================================================

export const TryXoa = ({ page }) => (
  <a href={`https://xen-orchestra.com/#/xoa?pk_campaign=xoa_source_upgrade&pk_kwd=${page}`}>{_('tryXoa')}</a>
)

// ===================================================================

export const getDetachedBackupsOrSnapshots = (backupsOrSnapshots, { jobs, schedules, vms }) => {
  if (jobs === undefined || schedules === undefined) {
    return []
  }

  const detachedBackupsOrSnapshots = []
  forEach(backupsOrSnapshots, backupOrSnapshot => {
    const { vmId, jobId, scheduleId } = backupOrSnapshot
    const vm = vms[vmId]
    const job = jobs[jobId]
    const reason =
      vm === undefined
        ? 'missingVm'
        : job === undefined
        ? 'missingJob'
        : schedules[scheduleId] === undefined
        ? 'missingSchedule'
        : !createPredicate(omit(job.vms, 'power_state'))(vm)
        ? 'missingVmInJob'
        : undefined

    if (reason !== undefined) {
      detachedBackupsOrSnapshots.push({
        ...backupOrSnapshot,
        reason,
      })
    }
  })

  return detachedBackupsOrSnapshots
}
