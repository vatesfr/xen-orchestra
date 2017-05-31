import _ from 'intl'
import HostActionBar from './action-bar'
import Icon from 'icon'
import Link from 'link'
import { NavLink, NavTabs } from 'nav'
import Page from '../page'
import React, { cloneElement, Component } from 'react'
import Tooltip from 'tooltip'
import { Text } from 'editable'
import { Container, Row, Col } from 'grid'
import {
  editHost,
  fetchHostStats,
  installAllHostPatches,
  installHostPatch,
  subscribeHostMissingPatches
} from 'xo'
import {
  connectStore,
  routes
} from 'utils'
import {
  createDoesHostNeedRestart,
  createGetObject,
  createGetObjectsOfType,
  createSelector
} from 'selectors'
import {
  assign,
  isEmpty,
  isString,
  map,
  pick,
  sortBy,
  sum
} from 'lodash'

import TabAdvanced from './tab-advanced'
import TabConsole from './tab-console'
import TabGeneral from './tab-general'
import TabLogs from './tab-logs'
import TabNetwork from './tab-network'
import TabPatches from './tab-patches'
import TabStats from './tab-stats'
import TabStorage from './tab-storage'

const isRunning = host => host && host.power_state === 'Running'

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
    (state, props) => getHost(state, props).$pool
  )

  const getVmController = createGetObjectsOfType('VM-controller').find(
    createSelector(
      getHost,
      ({ id }) => obj => obj.$container === id
    )
  )

  const getHostVms = createGetObjectsOfType('VM').filter(
    createSelector(
      getHost,
      ({ id }) => obj => obj.$container === id
    )
  )

  const getNumberOfVms = getHostVms.count()

  const getLogs = createGetObjectsOfType('message').filter(
    createSelector(
      getHost,
      getVmController,
      (host, controller) => ({ $object }) => $object === host.id || $object === controller.id
    )
  ).sort()

  const getPifs = createGetObjectsOfType('PIF').pick(
    createSelector(getHost, host => host.$PIFs)
  ).sort()

  const getNetworks = createGetObjectsOfType('network').pick(
    createSelector(
      getPifs,
      pifs => map(pifs, pif => pif.$network)
    )
  )

  const getHostPatches = createSelector(
    createGetObjectsOfType('pool_patch'),
    createGetObjectsOfType('host_patch').pick(
      createSelector(getHost, host => isString(host.patches[0]) ? host.patches : [])
    ),
    (poolsPatches, hostsPatches) => map(hostsPatches, hostPatch => ({
      ...hostPatch,
      poolPatch: poolsPatches[hostPatch.pool_patch]
    }))
  )

  const doesNeedRestart = createDoesHostNeedRestart(getHost)

  const getMemoryUsed = createSelector(
    getHostVms,
    vms => sum(map(vms, vm => vm.memory.size))
  )

  return (state, props) => {
    const host = getHost(state, props)
    if (!host) {
      return {}
    }

    return {
      host,
      hostPatches: getHostPatches(state, props),
      logs: getLogs(state, props),
      memoryUsed: getMemoryUsed(state, props),
      needsRestart: doesNeedRestart(state, props),
      networks: getNetworks(state, props),
      nVms: getNumberOfVms(state, props),
      pifs: getPifs(state, props),
      pool: getPool(state, props),
      vmController: getVmController(state, props),
      vms: getHostVms(state, props)
    }
  }
})
export default class Host extends Component {
  static contextTypes = {
    router: React.PropTypes.object
  }

  loop (host = this.props.host) {
    if (host == null) {
      return
    }

    if (this.cancel) {
      this.cancel()
    }

    if (!isRunning(host)) {
      return
    }

    let cancelled = false
    this.cancel = () => { cancelled = true }

    fetchHostStats(host).then(stats => {
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
  loop = ::this.loop

  componentDidMount () {
    this.loop()
    this.unsubscribeHostMissingPatches = subscribeHostMissingPatches(
      this.props.routeParams.id,
      missingPatches => this.setState({
        missingPatches: sortBy(missingPatches, patch => -patch.time)
      })
    )
  }

  componentWillUnmount () {
    clearTimeout(this.timeout)
    this.unsubscribeHostMissingPatches()
  }

  componentWillReceiveProps (props) {
    const hostNext = props.host
    if (!hostNext) {
      return
    }

    const hostCur = this.props.host
    if (hostCur && !hostNext) {
      this.context.router.push('/')
    }

    if (!isRunning(hostCur) && isRunning(hostNext)) {
      this.loop(hostNext)
    } else if (isRunning(hostCur) && !isRunning(hostNext)) {
      this.setState({
        statsOverview: undefined
      })
    }
  }

  _installAllPatches = () => {
    const { host } = this.props
    return installAllHostPatches(host)
  }

  _installPatch = patch => {
    const { host } = this.props
    return installHostPatch(host, patch)
  }

  _setNameDescription = nameDescription => editHost(this.props.host, { name_description: nameDescription })
  _setNameLabel = nameLabel => editHost(this.props.host, { name_label: nameLabel })

  header () {
    const { host, pool } = this.props
    const { missingPatches } = this.state || {}
    if (!host) {
      return <Icon icon='loading' />
    }
    return <Container>
      <Row>
        <Col mediumSize={6} className='header-title'>
          <h2>
            <Icon icon={host.power_state === 'Running' && !host.enabled ? 'host-disabled' : `host-${host.power_state.toLowerCase()}`} />
            {' '}
            <Text
              value={host.name_label}
              onChange={this._setNameLabel}
            />
          </h2>
          <span>
            <Text
              value={host.name_description}
              onChange={this._setNameDescription}
            />
            {pool && <span className='text-muted'> - <Link to={`/pools/${pool.id}`}>{pool.name_label}</Link></span>}
          </span>
        </Col>
        <Col mediumSize={6}>
          <div className='text-xs-center'>
            <HostActionBar host={host} />
          </div>
        </Col>
      </Row>
      <br />
      <Row>
        <Col>
          <NavTabs>
            <NavLink to={`/hosts/${host.id}/general`}>{_('generalTabName')}</NavLink>
            <NavLink to={`/hosts/${host.id}/stats`}>{_('statsTabName')}</NavLink>
            <NavLink to={`/hosts/${host.id}/console`}>{_('consoleTabName')}</NavLink>
            <NavLink to={`/hosts/${host.id}/network`}>{_('networkTabName')}</NavLink>
            <NavLink to={`/hosts/${host.id}/storage`}>{_('storageTabName')}</NavLink>
            <NavLink to={`/hosts/${host.id}/patches`}>
              {_('patchesTabName')} {isEmpty(missingPatches) ? null : <span className='tag tag-pill tag-danger'>{missingPatches.length}</span>}
              {(this.props.needsRestart && isEmpty(missingPatches)) && <Tooltip content={_('rebootUpdateHostLabel')}><Icon icon='alarm' /></Tooltip>}
            </NavLink>
            <NavLink to={`/hosts/${host.id}/logs`}>{_('logsTabName')}</NavLink>
            <NavLink to={`/hosts/${host.id}/advanced`}>{_('advancedTabName')}</NavLink>
          </NavTabs>
        </Col>
      </Row>
    </Container>
  }

  render () {
    const { host, pool } = this.props
    if (!host) {
      return <h1>{_('statusLoading')}</h1>
    }
    const childProps = assign(pick(this.props, [
      'host',
      'hostPatches',
      'logs',
      'memoryUsed',
      'networks',
      'nVms',
      'pbds',
      'pifs',
      'srs',
      'vmController',
      'vms'
    ]), pick(this.state, [
      'missingPatches',
      'statsOverview'
    ]), {
      installAllPatches: this._installAllPatches,
      installPatch: this._installPatch
    }
   )
    return <Page header={this.header()} title={`${host.name_label}${pool ? ` (${pool.name_label})` : ''}`}>
      {cloneElement(this.props.children, childProps)}
    </Page>
  }
}
