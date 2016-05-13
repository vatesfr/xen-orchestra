import _ from 'messages'
import assign from 'lodash/assign'
import forEach from 'lodash/forEach'
import Icon from 'icon'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import { NavLink, NavTabs } from 'nav'
import Page from '../page'
import pick from 'lodash/pick'
import React, { cloneElement, Component } from 'react'
import VmActionBar from './action-bar'
import { Text } from 'editable'
import {
  editVm,
  fetchVmStats
} from 'xo'
import { Container, Row, Col } from 'grid'
import {
  autobind,
  connectStore,
  mapPlus,
  routes
} from 'utils'
import {
  createFilter,
  createGetObject,
  createGetObjects,
  createSelector,
  createSort,
  messages
} from 'selectors'

import TabGeneral from './tab-general'
import TabStats from './tab-stats'
import TabConsole from './tab-console'
import TabDisks from './tab-disks'
import TabNetwork from './tab-network'
import TabSnapshots from './tab-snapshots'
import TabLogs from './tab-logs'
import TabAdvanced from './tab-advanced'

const isRunning = vm => vm && vm.power_state === 'Running'

// ===================================================================

@routes('general', {
  advanced: TabAdvanced,
  console: TabConsole,
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
    (...args) => getVm(...args).$container
  )

  const getPool = createGetObject(
    (...args) => getVm(...args).$pool
  )

  const getSnapshots = createSort(
    createGetObjects(
      createSelector(getVm, vm => vm.snapshots)
    ),
    snap => -snap.snapshot_time
  )

  const getVifs = createSort(
    createGetObjects(
      createSelector(getVm, vm => vm.VIFs),
    ),
    'device'
  )
  const getNetworks = createGetObjects(
    createSelector(
      getVifs,
      vifs => map(vifs, vif => vif.$network)
    )
  )

  const getVbds = createSort(
    createGetObjects(
      createSelector(getVm, vm => vm.$VBDs)
    ),
    'position'
  )
  const getVdis = createGetObjects(
    createSelector(
      getVbds,
      vbds => mapPlus(vbds, (vbd, push) => {
        if (!vbd.is_cd_drive && vbd.VDI) {
          push(vbd.VDI)
        }
      })
    )
  )
  const getSrs = createGetObjects(
    createSelector(
      getVdis,
      vdis => map(vdis, vdi => vdi.$SR)
    )
  )

  const getVmTotalDiskSpace = createSelector(
    getVdis,
    vdis => {
      let vmTotalDiskSpace = 0
      forEach(vdis, vdi => {
        vmTotalDiskSpace += vdi.size
      })
      return vmTotalDiskSpace
    }
  )

  const getLogs = createFilter(
    messages,
    createSelector(
      getVm,
      ({ id }) => message => message.$object === id
    ),
    true
  )

  return (state, props) => {
    const vm = getVm(state, props)
    if (!vm) {
      return {}
    }

    return {
      container: getContainer(state, props),
      logs: getLogs(state, props),
      networks: getNetworks(state, props),
      pool: getPool(state, props),
      snapshots: getSnapshots(state, props),
      srs: getSrs(state, props),
      vbds: getVbds(state, props),
      vdis: getVdis(state, props),
      vifs: getVifs(state, props),
      vm,
      vmTotalDiskSpace: getVmTotalDiskSpace(state, props)
    }
  }
})
export default class Vm extends Component {
  @autobind
  loop (vm = this.props.vm) {
    if (this.cancel) {
      this.cancel()
    }

    if (!isRunning(vm)) {
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

  componentWillMount () {
    this.loop()
  }

  componentWillUnmount () {
    clearTimeout(this.timeout)
  }

  componentWillReceiveProps (props) {
    const vmCur = this.props.vm
    const vmNext = props.vm

    if (!isRunning(vmCur) && isRunning(vmNext)) {
      this.loop(vmNext)
    } else if (isRunning(vmCur) && !isRunning(vmNext)) {
      this.setState({
        statsOverview: undefined
      })
    }
  }

  _setNameDescription = nameDescription => editVm(this.props.vm, { name_description: nameDescription })
  _setNameLabel = nameLabel => editVm(this.props.vm, { name_label: nameLabel })

  header () {
    const { vm, container, pool, snapshots } = this.props
    if (!vm || !pool) {
      return <Icon icon='loading' />
    }
    return <Container>
      <Row className='header-title'>
        <Col smallSize={6}>
          <h2>
            {isEmpty(vm.current_operations)
              ? <Icon icon={`vm-${vm.power_state.toLowerCase()}`} />
              : <Icon icon='vm-busy' />
            }
            &nbsp;
            <Text
              onChange={this._setNameLabel}
            >{vm.name_label}</Text>
          </h2>
          <span>
            <Text
              onChange={this._setNameDescription}
            >{vm.name_description}</Text>
            <span className='text-muted'>
              {vm.power_state === 'Running' ? ' - ' + container.name_label : null}
              {' '}({pool.name_label})
            </span>
          </span>
        </Col>
        <Col smallSize={6}>
          <div className='pull-xs-right'>
            <VmActionBar vm={vm} handlers={this.props} />
          </div>
        </Col>
      </Row>
      <Row>
        <Col size={12}>
          <NavTabs>
            <NavLink to={`/vms/${vm.id}/general`}>{_('generalTabName')}</NavLink>
            <NavLink to={`/vms/${vm.id}/stats`}>{_('statsTabName')}</NavLink>
            <NavLink to={`/vms/${vm.id}/console`}>{_('consoleTabName')}</NavLink>
            <NavLink to={`/vms/${vm.id}/network`}>{_('networkTabName')}</NavLink>
            <NavLink to={`/vms/${vm.id}/disks`}>{_('disksTabName', { disks: vm.$VBDs.length })}</NavLink>
            <NavLink to={`/vms/${vm.id}/snapshots`}>{_('snapshotsTabName')} {isEmpty(snapshots) ? null : <span className='label label-pill label-default'>{snapshots.length}</span>}</NavLink>
            <NavLink to={`/vms/${vm.id}/logs`}>{_('logsTabName')}</NavLink>
            <NavLink to={`/vms/${vm.id}/advanced`}>{_('advancedTabName')}</NavLink>
          </NavTabs>
        </Col>
      </Row>
    </Container>
  }

  render () {
    const { vm } = this.props

    if (!vm) {
      return <h1>Loading…</h1>
    }

    const childProps = assign(pick(this.props, [
      'container',
      'logs',
      'networks',
      'pool',
      'removeTag',
      'snapshots',
      'srs',
      'vbds',
      'vdis',
      'vifs',
      'vm',
      'vmTotalDiskSpace'
    ]), pick(this.state, [
      'statsOverview'
    ]))
    return <Page header={this.header()}>
      {cloneElement(this.props.children, childProps)}
    </Page>
  }
}
