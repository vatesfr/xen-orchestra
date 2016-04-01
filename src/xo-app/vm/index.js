import _ from 'messages'
import assign from 'lodash/assign'
import forEach from 'lodash/forEach'
import isEmpty from 'lodash/isEmpty'
import Link from 'react-router/lib/Link'
import map from 'lodash/map'
import pick from 'lodash/pick'
import React, { cloneElement, Component } from 'react'
import sortBy from 'lodash/sortBy'
import xo from 'xo'
import { createSelector } from 'reselect'
import { Row, Col } from 'grid'
import {
  connectStore,
  createCollectionSelector,
  routes
} from 'utils'

import VmActionBar from './action-bar'
import TabGeneral from './tab-general'
import TabStats from './tab-stats'
import TabConsole from './tab-console'
import TabDisks from './tab-disks'
import TabNetwork from './tab-network'
import TabSnapshots from './tab-snapshots'
import TabLogs from './tab-logs'
import TabAdvanced from './tab-advanced'

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

@routes({
  onEnter: (state, replace) => {
    replace(`${state.location.pathname}/general`)
  }
}, [
  { path: 'general', component: TabGeneral },
  { path: 'stats', component: TabStats },
  { path: 'console', component: TabConsole },
  { path: 'disks', component: TabDisks },
  { path: 'network', component: TabNetwork },
  { path: 'snapshots', component: TabSnapshots },
  { path: 'logs', component: TabLogs },
  { path: 'advanced', component: TabAdvanced }
])
@connectStore(() => {
  const getSnapshots = createSelector(
    createCollectionSelector(
      createSelector(
        (_, vm) => vm.snapshots,
        (objects) => objects,
        (snapshotIds, objects) => map(snapshotIds, (id) => objects[id])
      )
    ),
    (snapshots) => sortBy(snapshots, (snap) => -snap.snapshot_time)
  )
  const getVifs = createSelector(
    createCollectionSelector(
      createSelector(
        (_, vm) => vm.VIFs,
        (objects) => objects,
        (vifIds, objects) => map(vifIds, (id) => objects[id])
      )
    ),
    (vifs) => sortBy(vifs, 'device')
  )
  const getNetworkByVifs = createCollectionSelector(
    createSelector(
      (objects) => objects,
      (_, vifs) => vifs,
      (objects, vifs) => {
        const networkByVifs = {}
        forEach(vifs, (vif) => {
          networkByVifs[vif.id] = objects[vif.$network]
        })
        return networkByVifs
      }
    )
  )
  const getVbds = createSelector(
    createCollectionSelector(
      createSelector(
        (_, vm) => vm.$VBDs,
        (objects) => objects,
        (vbdIds, objects) => map(vbdIds, (id) => objects[id])
      )
    ),
    (vbds) => sortBy(vbds, 'position')
  )
  const getVdiByVbds = createCollectionSelector(
    createSelector(
      (objects) => objects,
      (_, vbds) => vbds,
      (objects, vbds) => {
        const vdiByVbds = {}
        forEach(vbds, (vbd) => {
          // if VDI is defined and not a CD drive
          if (objects[vbd.VDI] && !vbd.is_cd_drive) {
            vdiByVbds[vbd.id] = objects[vbd.VDI]
          }
        })
        return vdiByVbds
      }
    )
  )
  const getVmTotalDiskSpace = createCollectionSelector(
    createSelector(
      (vdiByVbds) => vdiByVbds,
      (vdiByVbds) => {
        let vmTotalDiskSpace = 0
        const processedVdis = {}
        forEach(vdiByVbds, (vdi) => {
          // Avoid counting multiple time the same VDI
          if (!processedVdis[vdi.id]) {
            processedVdis[vdi.id] = true
            vmTotalDiskSpace = vmTotalDiskSpace + vdi.size
          }
        })
        return vmTotalDiskSpace
      }
    )
  )
  return (state, props) => {
    const { objects } = state
    const { id } = props.params

    const vm = objects[id]
    if (!vm) {
      return {}
    }

    const vbds = getVbds(objects, vm)
    const vifs = getVifs(objects, vm)
    const vdiByVbds = getVdiByVbds(objects, vbds)

    return {
      container: objects[vm.$container],
      networkByVifs: getNetworkByVifs(objects, vifs),
      pool: objects[vm.$pool],
      snapshots: getSnapshots(objects, vm),
      vbds,
      vdiByVbds,
      vifs,
      vm,
      vmTotalDiskSpace: getVmTotalDiskSpace(vdiByVbds)
    }
  }
})
export default class Vm extends Component {
  componentWillMount () {
    const vmId = this.props.params.id

    // FIXME: babel-eslint bug
    const loop = async () => { // eslint-disable-line arrow-parens
      const granularity = this.statsGranularity
      const [ statsOverview, stats = statsOverview ] = await Promise.all([
        xo.call('vm.stats', { id: vmId }),
        granularity && granularity !== 'seconds'
          ? xo.call('vm.stats', { id: vmId, granularity })
          : undefined
      ])

      this.setState({
        stats,
        statsOverview,
        selectStatsLoading: false
      })

      this.timeout = setTimeout(loop, 5000)
    }

    loop()
  }

  handleSelectStats (event) {
    this.statsGranularity = event.target.value

    this.setState({
      selectStatsLoading: true
    })
  }

  componentWillUnmount () {
    clearTimeout(this.timeout)
  }

  render () {
    const { container, pool, snapshots, vm } = this.props
    if (!vm) {
      return <h1>Loading…</h1>
    }

    const childProps = assign({}, pick(this.props, [
      'addTag',
      'container',
      'networkByVifs',
      'pool',
      'removeTag',
      'snapshots',
      'vbds',
      'vdiByVbds',
      'vifs',
      'vm',
      'vmTotalDiskSpace'
    ]), pick(this.state, [
      'selectStatsLoading',
      'stats',
      'statsOverview'
    ]))

    return <div>
      <Row>
        <Col smallSize={6}>
          <h1>
            {vm.name_label}
            <small className='text-muted'> - {container.name_label} ({pool.name_label})</small>
          </h1>
          <p className='lead'>{vm.name_description}</p>
        </Col>
        <Col smallSize={6}>
          <div className='pull-xs-right'>
            <VmActionBar vm={vm} handlers={this.props}/>
          </div>
        </Col>
      </Row>
      <Row>
        <Col size={12}>
          <NavTabs>
            <NavLink to={`/vms/${vm.id}/general`}>{_('generalTabName')}</NavLink>
            <NavLink to={`/vms/${vm.id}/stats`}>{_('statsTabName')}</NavLink>
            <NavLink to={`/vms/${vm.id}/console`}>{_('consoleTabName')}</NavLink>
            <NavLink to={`/vms/${vm.id}/disks`}>{_('disksTabName', { disks: vm.$VBDs.length })}</NavLink>
            <NavLink to={`/vms/${vm.id}/network`}>{_('networkTabName')}</NavLink>
            <NavLink to={`/vms/${vm.id}/snapshots`}>{_('snapshotsTabName')} {isEmpty(snapshots) ? null : <span className='label label-pill label-default'>{snapshots.length}</span>}</NavLink>
            <NavLink to={`/vms/${vm.id}/logs`}>{_('logsTabName')}</NavLink>
            <NavLink to={`/vms/${vm.id}/advanced`}>{_('advancedTabName')}</NavLink>
          </NavTabs>
        </Col>
      </Row>
      {cloneElement(this.props.children, childProps)}
    </div>
  }
}
