import _ from 'intl'
import BaseComponent from 'base-component'
import Copiable from 'copiable'
import Icon from 'icon'
import Tooltip from 'tooltip'
import { NavLink, NavTabs } from 'nav'
import PropTypes from 'prop-types'
import React, { cloneElement } from 'react'
import { Host, Pool } from 'render-xo-item'
import { Text, XoSelect } from 'editable'
import { isEmpty, map, pick } from 'lodash'
import { editVm, fetchVmStats, isVmRunning, migrateVm } from 'xo'
import { Container, Row, Col } from 'grid'
import { connectStore, routes } from 'utils'
import {
  createGetObject,
  createGetObjectsOfType,
  createGetVmDisks,
  createSelector,
  createSumBy,
  getCheckPermissions,
  isAdmin,
} from 'selectors'

import Page from '../page'
import TabGeneral from './tab-general'
import TabStats from './tab-stats'
import TabConsole from './tab-console'
import TabContainers from './tab-containers'
import TabDisks from './tab-disks'
import TabNetwork from './tab-network'
import TabSnapshots from './tab-snapshots'
import TabBackups from './tab-backups'
import TabLogs from './tab-logs'
import TabAdvanced from './tab-advanced'
import VmActionBar from './action-bar'

// ===================================================================

@routes('general', {
  advanced: TabAdvanced,
  backups: TabBackups,
  console: TabConsole,
  containers: TabContainers,
  disks: TabDisks,
  general: TabGeneral,
  logs: TabLogs,
  network: TabNetwork,
  snapshots: TabSnapshots,
  stats: TabStats,
})
@connectStore(() => {
  const getVm = createGetObject()

  const getContainer = createGetObject((state, props) => getVm(state, props).$container)

  const getPool = createGetObject((state, props) => getVm(state, props).$pool)

  const getVbds = createGetObjectsOfType('VBD')
    .pick((state, props) => getVm(state, props).$VBDs)
    .sort()
  const getVdis = createGetVmDisks(getVm)
  const getSrs = createGetObjectsOfType('SR').pick(createSelector(getVdis, vdis => map(vdis, '$SR')))

  const getVmTotalDiskSpace = createSumBy(createGetVmDisks(getVm), 'size')

  return (state, props) => {
    const vm = getVm(state, props)
    if (!vm) {
      return {}
    }

    return {
      checkPermissions: getCheckPermissions(state, props),
      container: getContainer(state, props),
      isAdmin: isAdmin(state, props),
      pool: getPool(state, props),
      srs: getSrs(state, props),
      vbds: getVbds(state, props),
      // Workaround to get the VDI object when the permissions cache isn't up to date:
      // when a VDI is created on a VM, the user permissions might be checked on the
      // VBD *before* it's attached to the VM so the permissions cache will store that
      // the user doesn't have permissions on the VDI even after it's been attached
      vdis: getVdis(state, props, true),
      vm,
      vmTotalDiskSpace: getVmTotalDiskSpace(state, props),
    }
  }
})
export default class Vm extends BaseComponent {
  static contextTypes = {
    router: PropTypes.object,
  }

  loop(vm = this.props.vm) {
    if (this.cancel) {
      this.cancel()
    }

    if (!isVmRunning(vm)) {
      return
    }

    let cancelled = false
    this.cancel = () => {
      cancelled = true
    }

    fetchVmStats(vm).then(stats => {
      if (cancelled) {
        return
      }
      this.cancel = null

      clearTimeout(this.timeout)
      this.setState(
        {
          statsOverview: stats,
        },
        () => {
          this.timeout = setTimeout(this.loop, stats.interval * 1000)
        }
      )
    })
  }
  loop = ::this.loop

  componentWillMount() {
    this.loop()
  }

  componentWillUnmount() {
    clearTimeout(this.timeout)
  }

  componentWillReceiveProps(props) {
    const vmCur = this.props.vm
    const vmNext = props.vm

    if (vmCur && !vmNext) {
      this.context.router.push('/')
    }

    if (!isVmRunning(vmCur) && isVmRunning(vmNext)) {
      this.loop(vmNext)
    } else if (isVmRunning(vmCur) && !isVmRunning(vmNext)) {
      this.setState({
        statsOverview: undefined,
      })
    }
  }

  compareContainers = (pool1, pool2) => {
    const { $pool: poolId } = this.props.vm
    return pool1.id === poolId ? -1 : pool2.id === poolId ? 1 : 0
  }

  _getCanSnapshot = createSelector(
    () => this.props.checkPermissions,
    () => this.props.vm,
    () => this.props.srs,
    (checkPermissions, vm, srs) => checkPermissions(vm.id, 'operate')
  )

  _setNameDescription = nameDescription => editVm(this.props.vm, { name_description: nameDescription })
  _setNameLabel = nameLabel => editVm(this.props.vm, { name_label: nameLabel })
  _migrateVm = host => migrateVm(this.props.vm, host)

  _getVmState = createSelector(
    () => this.props.vm.power_state,
    () => this.props.vm.current_operations,
    (powerState, operations) => (!isEmpty(operations) ? 'Busy' : powerState)
  )

  header() {
    const { isAdmin, vm, container, pool } = this.props
    if (!vm) {
      return <Icon icon='loading' />
    }
    const state = this._getVmState()

    return (
      <Container>
        <Row>
          <Col mediumSize={6} className='header-title'>
            <span>
              <span className='text-muted'>
                {pool !== undefined && <Pool id={pool.id} link />}
                {vm.power_state === 'Running' && (
                  <span>
                    {container !== undefined && pool !== undefined && (
                      <span>
                        {' '}
                        <Icon icon='next' />{' '}
                      </span>
                    )}
                    {container !== undefined && (
                      <XoSelect
                        compareContainers={this.compareContainers}
                        onChange={this._migrateVm}
                        useLongClick
                        value={container}
                        xoType='host'
                      >
                        <Host id={container.id} pool={false} link />
                      </XoSelect>
                    )}
                  </span>
                )}
              </span>
            </span>
            <h2>
              <Tooltip
                content={
                  <span>
                    {_(`powerState${state}`)}
                    {state === 'Busy' && (
                      <span>
                        {' ('}
                        {map(vm.current_operations)[0]}
                        {')'}
                      </span>
                    )}
                  </span>
                }
              >
                <Icon icon={`vm-${state.toLowerCase()}`} />
              </Tooltip>{' '}
              <Text value={vm.name_label} onChange={this._setNameLabel} />
            </h2>{' '}
            <Copiable tagName='pre' className='text-muted mb-0'>
              {vm.uuid}
            </Copiable>
            <Text value={vm.name_description} onChange={this._setNameDescription} />
          </Col>
          <Col mediumSize={6} className='text-xs-center'>
            <div>
              <VmActionBar vm={vm} />
            </div>
          </Col>
        </Row>
        <Row>
          <Col>
            <NavTabs>
              <NavLink to={`/vms/${vm.id}/general`}>{_('generalTabName')}</NavLink>
              <NavLink to={`/vms/${vm.id}/stats`}>{_('statsTabName')}</NavLink>
              <NavLink to={`/vms/${vm.id}/console`}>{_('consoleTabName')}</NavLink>
              <NavLink to={`/vms/${vm.id}/network`}>{_('networkTabName')}</NavLink>
              <NavLink to={`/vms/${vm.id}/disks`}>{_('disksTabName', { disks: vm.$VBDs.length })}</NavLink>
              {this._getCanSnapshot() && (
                <NavLink to={`/vms/${vm.id}/snapshots`}>
                  {_('snapshotsTabName')}{' '}
                  {vm.snapshots.length !== 0 && <span className='tag tag-pill tag-default'>{vm.snapshots.length}</span>}
                </NavLink>
              )}
              {isAdmin && <NavLink to={`/vms/${vm.id}/backups`}>{_('backup')}</NavLink>}
              <NavLink to={`/vms/${vm.id}/logs`}>{_('logsTabName')}</NavLink>
              {vm.docker && <NavLink to={`/vms/${vm.id}/containers`}>{_('containersTabName')}</NavLink>}
              <NavLink to={`/vms/${vm.id}/advanced`}>{_('advancedTabName')}</NavLink>
            </NavTabs>
          </Col>
        </Row>
      </Container>
    )
  }

  _toggleHeader = () => this.setState({ collapsedHeader: !this.state.collapsedHeader })

  render() {
    const { container, vm } = this.props
    if (!vm) {
      return <h1>{_('statusLoading')}</h1>
    }

    const childProps = Object.assign(
      pick(this.props, ['container', 'pool', 'removeTag', 'srs', 'vbds', 'vdis', 'vm', 'vmTotalDiskSpace']),
      pick(this.state, ['statsOverview'])
    )
    return (
      <Page
        header={this.header()}
        collapsedHeader={this.state.collapsedHeader}
        title={`${vm.name_label}${container ? ` (${container.name_label})` : ''}`}
      >
        {cloneElement(this.props.children, {
          ...childProps,
          toggleHeader: this._toggleHeader,
        })}
      </Page>
    )
  }
}
