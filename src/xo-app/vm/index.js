import _ from 'intl'
import BaseComponent from 'base-component'
import Icon from 'icon'
import Link from 'link'
import { NavLink, NavTabs } from 'nav'
import Page from '../page'
import React, { cloneElement } from 'react'
import VmActionBar from './action-bar'
import { Select, Text } from 'editable'
import {
  assign,
  isEmpty,
  map,
  pick
} from 'lodash'
import {
  editVm,
  fetchVmStats,
  isVmRunning,
  migrateVm
} from 'xo'
import { Container, Row, Col } from 'grid'
import {
  connectStore,
  routes
} from 'utils'
import {
  createGetObject,
  createGetObjectsOfType,
  createGetVmDisks,
  createSelector,
  createSumBy,
  getCheckPermissions,
  isAdmin
} from 'selectors'

import TabGeneral from './tab-general'
import TabStats from './tab-stats'
import TabConsole from './tab-console'
import TabContainers from './tab-containers'
import TabDisks from './tab-disks'
import TabNetwork from './tab-network'
import TabSnapshots from './tab-snapshots'
import TabLogs from './tab-logs'
import TabAdvanced from './tab-advanced'

// ===================================================================

@routes('general', {
  advanced: TabAdvanced,
  console: TabConsole,
  containers: TabContainers,
  disks: TabDisks,
  general: TabGeneral,
  logs: TabLogs,
  network: TabNetwork,
  snapshots: TabSnapshots,
  stats: TabStats
})
@connectStore(() => {
  const getVm = createGetObject()

  const getContainer = createGetObject(
    (state, props) => getVm(state, props).$container
  )

  const getPool = createGetObject(
    (state, props) => getVm(state, props).$pool
  )

  const getVbds = createGetObjectsOfType('VBD').pick(
    (state, props) => getVm(state, props).$VBDs
  ).sort()
  const getVdis = createGetVmDisks(getVm)
  const getSrs = createGetObjectsOfType('SR').pick(
    createSelector(
      getVdis,
      vdis => map(vdis, vdi => vdi.$SR)
    )
  )

  const getVmTotalDiskSpace = createSumBy(
    createGetVmDisks(getVm),
    'size'
  )

  const getHosts = createGetObjectsOfType('host')

  return (state, props) => {
    const vm = getVm(state, props)
    if (!vm) {
      return {}
    }

    return {
      checkPermissions: getCheckPermissions(state, props),
      container: getContainer(state, props),
      hosts: getHosts(state, props),
      isAdmin: isAdmin(state, props),
      pool: getPool(state, props),
      srs: getSrs(state, props),
      vbds: getVbds(state, props),
      vdis: getVdis(state, props),
      vm,
      vmTotalDiskSpace: getVmTotalDiskSpace(state, props)
    }
  }
})
export default class Vm extends BaseComponent {
  static contextTypes = {
    router: React.PropTypes.object
  }

  loop (vm = this.props.vm) {
    if (this.cancel) {
      this.cancel()
    }

    if (!isVmRunning(vm)) {
      return
    }

    let cancelled = false
    this.cancel = () => { cancelled = true }

    fetchVmStats(vm).then(stats => {
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

  componentWillMount () {
    this.loop()
  }

  componentWillUnmount () {
    clearTimeout(this.timeout)
  }

  componentWillReceiveProps (props) {
    const vmCur = this.props.vm
    const vmNext = props.vm

    if (vmCur && !vmNext) {
      this.context.router.push('/')
    }

    if (!isVmRunning(vmCur) && isVmRunning(vmNext)) {
      this.loop(vmNext)
    } else if (isVmRunning(vmCur) && !isVmRunning(vmNext)) {
      this.setState({
        statsOverview: undefined
      })
    }
  }

  _getCanSnapshot = createSelector(
    () => this.props.checkPermissions,
    () => this.props.vm,
    () => this.props.srs,
    (checkPermissions, vm, srs) => checkPermissions([
      [ vm.id, 'administrate' ],
      ...map(srs, sr => [ sr.id, 'operate' ])
    ])
  )

  _setNameDescription = nameDescription => editVm(this.props.vm, { name_description: nameDescription })
  _setNameLabel = nameLabel => editVm(this.props.vm, { name_label: nameLabel })
  _migrateVm = host => migrateVm(this.props.vm, host)

  _selectOptionRenderer = option => option.name_label

  header () {
    const { vm, container, pool, hosts } = this.props
    if (!vm) {
      return <Icon icon='loading' />
    }
    return <Container>
      <Row>
        <Col mediumSize={6} className='header-title'>
          <h2>
            {isEmpty(vm.current_operations)
              ? <Icon icon={`vm-${vm.power_state.toLowerCase()}`} />
              : <Icon icon='vm-busy' />
            }
            {' '}
            <Text
              value={vm.name_label}
              onChange={this._setNameLabel}
            />
          </h2>
          <span>
            <Text
              value={vm.name_description}
              onChange={this._setNameDescription}
            />
            <span className='text-muted'>
              {vm.power_state === 'Running' && container &&
                <span>
                  <span> - </span>
                  <Select
                    onChange={this._migrateVm}
                    options={hosts}
                    renderer={this._selectOptionRenderer}
                    useLongClick
                    value={container}
                  >
                    <Link to={`/${container.type}s/${container.id}`}>{container.name_label}</Link>
                  </Select>
                </span>
              }
              {' '}
              {pool && (<Link to={`/pools/${pool.id}`}>{pool.name_label}</Link>)}
            </span>
          </span>
        </Col>
        <Col mediumSize={6} className='text-xs-center'>
          <div>
            <VmActionBar vm={vm} />
          </div>
        </Col>
      </Row>
      <br />
      <Row>
        <Col>
          <NavTabs>
            <NavLink to={`/vms/${vm.id}/general`}>{_('generalTabName')}</NavLink>
            <NavLink to={`/vms/${vm.id}/stats`}>{_('statsTabName')}</NavLink>
            <NavLink to={`/vms/${vm.id}/console`}>{_('consoleTabName')}</NavLink>
            <NavLink to={`/vms/${vm.id}/network`}>{_('networkTabName')}</NavLink>
            <NavLink to={`/vms/${vm.id}/disks`}>{_('disksTabName', { disks: vm.$VBDs.length })}</NavLink>
            {this._getCanSnapshot() && <NavLink to={`/vms/${vm.id}/snapshots`}>{_('snapshotsTabName')} {vm.snapshots.length !== 0 && <span className='tag tag-pill tag-default'>{vm.snapshots.length}</span>}</NavLink>}
            <NavLink to={`/vms/${vm.id}/logs`}>{_('logsTabName')}</NavLink>
            {vm.docker && <NavLink to={`/vms/${vm.id}/containers`}>{_('containersTabName')}</NavLink>}
            <NavLink to={`/vms/${vm.id}/advanced`}>{_('advancedTabName')}</NavLink>
          </NavTabs>
        </Col>
      </Row>
    </Container>
  }

  _toggleHeader = () => this.setState({ collapsedHeader: !this.state.collapsedHeader })

  render () {
    const { container, vm } = this.props

    if (!vm) {
      return <h1>{_('statusLoading')}</h1>
    }

    const childProps = assign(pick(this.props, [
      'container',
      'pool',
      'removeTag',
      'srs',
      'vbds',
      'vdis',
      'vm',
      'vmTotalDiskSpace'
    ]), pick(this.state, [
      'statsOverview'
    ]))
    return <Page header={this.header()} collapsedHeader={this.state.collapsedHeader} title={`${vm.name_label}${container ? ` (${container.name_label})` : ''}`}>
      {cloneElement(this.props.children, { ...childProps, toggleHeader: this._toggleHeader })}
    </Page>
  }
}
