import _ from 'messages'
import assign from 'lodash/assign'
import isEmpty from 'lodash/isEmpty'
import Link from 'react-router/lib/Link'
import map from 'lodash/map'
import pick from 'lodash/pick'
import sortBy from 'lodash/sortBy'
import React, { cloneElement, Component } from 'react'
import xo, { getHostMissingPatches } from 'xo'
import { Row, Col } from 'grid'
import {
  autobind,
  connectStore,
  routes
} from 'utils'
import {
  create as createSelector,
  createFilter,
  createFinder,
  createGetObject,
  createGetObjects,
  createSort,
  objects,
  messages
} from 'selectors'

import TabAdvanced from './tab-advanced'
import TabConsole from './tab-console'
import TabGeneral from './tab-general'
import TabLogs from './tab-logs'
import TabNetwork from './tab-network'
import TabPatches from './tab-patches'
import TabStats from './tab-stats'
import TabStorage from './tab-storage'

const isRunning = (host) => host && host.power_state === 'Running'

// ===================================================================

const NavLink = ({ children, to }) => (
  <li className='nav-item' role='tab'>
    <Link className='nav-link' activeClassName='active' to={to}>
      {children}
    </Link>
  </li>
)

const NavTabs = ({ children }) => (
  <ul className='nav nav-tabs' role='tablist'>
    {children}
  </ul>
)

// ===================================================================

@routes('general', {
  advanced: TabAdvanced,
  console: TabConsole,
  general: TabGeneral,
  logs: TabLogs,
  network: TabNetwork,
  patches: TabPatches,
  stats: TabStats,
  storage: TabStorage
})
@connectStore(() => {
  const getHost = createGetObject()

  const getPool = createGetObject(
    (...args) => getHost(...args).$pool
  )

  const getVmController = createFinder(
    objects,
    createSelector(
      getHost,
      ({ id }) => (obj) => obj.type === 'VM-controller' && obj.$container === id
    ),
    true
  )

  const getLogs = createFilter(
    messages,
    createSelector(
      getHost,
      getVmController,
      (host, controller) => ({ $object }) => $object === host.id || $object === controller.id
    ),
    true
  )

  const getPifs = createSort(
    createGetObjects(
      createSelector(getHost, (host) => host.PIFs),
    ),
    'device'
  )

  const getNetworks = createGetObjects(
    createSelector(
      getPifs,
      (pifs) => map(pifs, (pif) => pif.$network)
    )
  )

  const getPoolPatches = createSort(
    createGetObjects(
      createSelector(
        createGetObjects(
          createSelector(getHost, (host) => host.patches)
        ),
        (patches) => map(patches, (patch) => patch.pool_patch)
      )
    ),
    (patch) => patch.name
  )

  const getPbds = createGetObjects(
      createSelector(getHost, (host) => host.$PBDs)
    )

  const getSrs = createGetObjects(
    createSelector(
      getPbds,
      (pbds) => map(pbds, (pbd) => pbd.SR)
    )
  )

  return (state, props) => {
    const host = getHost(state, props)
    if (!host) {
      return {}
    }

    return {
      host,
      logs: getLogs(state, props),
      networks: getNetworks(state, props),
      pbds: getPbds(state, props),
      pifs: getPifs(state, props),
      pool: getPool(state, props),
      poolPatches: getPoolPatches(state, props),
      srs: getSrs(state, props),
      vmController: getVmController(state, props)
    }
  }
})
export default class Host extends Component {
  @autobind
  loop (host = this.props.host) {
    if (this.cancel) {
      this.cancel()
    }

    if (!isRunning(host)) {
      return
    }

    let cancelled = false
    this.cancel = () => { cancelled = true }

    xo.call('host.stats', { host: host.id }).then((stats) => {
      if (cancelled) {
        return
      }
      this.cancel = null

      clearTimeout(this.timeout)
      this.setState({
        statsOverview: stats
      }, () => {
        this.timeout = setTimeout(this.loop, stats.interval * 1000)
      })
    })
  }

  _getMissingPatches (host) {
    getHostMissingPatches(host).then((missingPatches) => {
      this.setState({ missingPatches: sortBy(missingPatches, (patch) => -patch.time) })
    })
  }

  componentWillMount () {
    if (!this.props.host) {
      return
    }
    this.loop()
    this._getMissingPatches(this.props.host)
  }

  componentWillUnmount () {
    clearTimeout(this.timeout)
  }

  componentWillReceiveProps (props) {
    const hostNext = props.host
    if (!hostNext) {
      return
    }

    const hostCur = this.props.host
    if (!hostCur) {
      this._getMissingPatches(hostNext)
    }

    if (!isRunning(hostCur) && isRunning(hostNext)) {
      this.loop(hostNext)
    } else if (isRunning(hostCur) && !isRunning(hostNext)) {
      this.setState({
        statsOverview: undefined
      })
    }
  }
  render () {
    const { host } = this.props
    const { missingPatches } = this.state || {}
    if (!host) {
      return <h1>Loading…</h1>
    }
    const childProps = assign(pick(this.props, [
      'addTag',
      'host',
      'logs',
      'networks',
      'pbds',
      'pifs',
      'poolPatches',
      'srs',
      'vmController'
    ]), pick(this.state, [
      'missingPatches',
      'statsOverview'
    ])
   )
    return <div>
      <Row>
        <Col size={12}>
          <NavTabs>
            <NavLink to={`/hosts/${host.id}/general`}>{_('generalTabName')}</NavLink>
            <NavLink to={`/hosts/${host.id}/stats`}>{_('statsTabName')}</NavLink>
            <NavLink to={`/hosts/${host.id}/console`}>{_('consoleTabName')}</NavLink>
            <NavLink to={`/hosts/${host.id}/network`}>{_('networkTabName')}</NavLink>
            <NavLink to={`/hosts/${host.id}/storage`}>{_('storageTabName')}</NavLink>
            <NavLink to={`/hosts/${host.id}/patches`}>{_('patchesTabName')} {isEmpty(missingPatches) ? null : <span className='label label-pill label-danger'>{missingPatches.length}</span>}</NavLink>
            <NavLink to={`/hosts/${host.id}/logs`}>{_('logsTabName')}</NavLink>
            <NavLink to={`/hosts/${host.id}/advanced`}>{_('advancedTabName')}</NavLink>
          </NavTabs>
        </Col>
      </Row>
      {cloneElement(this.props.children, childProps)}
    </div>
  }
}
