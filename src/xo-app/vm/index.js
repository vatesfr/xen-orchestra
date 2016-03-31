import _ from 'messages'
import forEach from 'lodash/forEach'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import React, { Component } from 'react'
import sortBy from 'lodash/sortBy'
import xo from 'xo'
import { createSelector } from 'reselect'
import { Row, Col } from 'grid'
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs'
import {
  connectStore,
  createCollectionSelector
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
    const {
      addTag,
      container,
      networkByVifs,
      pool,
      removeTag,
      snapshots,
      vbds,
      vdiByVbds,
      vifs,
      vm,
      vmTotalDiskSpace
    } = this.props

    const {
      stats,
      statsOverview,
      selectStatsLoading
    } = this.state || {}

    if (!vm) {
      return <h1>Loading…</h1>
    }

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
      <Tabs>
        <TabList>
          <Tab>{_('generalTabName')}</Tab>
          <Tab>{_('statsTabName')}</Tab>
          <Tab>{_('consoleTabName')}</Tab>
          <Tab>{_('disksTabName', { disks: vm.$VBDs.length })}</Tab>
          <Tab>{_('networkTabName')}</Tab>
          <Tab>{_('snapshotsTabName')} {isEmpty(snapshots) ? null : <span className='label label-pill label-default'>{snapshots.length}</span>}</Tab>
          <Tab>{_('logsTabName')}</Tab>
          <Tab>{_('advancedTabName')}</Tab>
        </TabList>
        <TabPanel>
          <TabGeneral {...{
            addTag,
            removeTag,
            statsOverview,
            vm,
            vmTotalDiskSpace
          }} />
        </TabPanel>
        <TabPanel>
          <TabStats {...{
            handleSelectStats: ::this.handleSelectStats,
            selectStatsLoading,
            stats,
            statsGranularity: this.statsGranularity
          }}/>
        </TabPanel>
        <TabPanel className='text-xs-center'>
          <TabConsole {...{
            statsOverview,
            vm
          }} />
        </TabPanel>
        <TabPanel>
          <TabDisks {...{
            vbds,
            vdiByVbds
          }} />
        </TabPanel>
        <TabPanel>
          <TabNetwork {...{
            networkByVifs,
            vifs,
            vm
          }} />
        </TabPanel>
        <TabPanel>
          <TabSnapshots {...{
            snapshots,
            vm
          }} />
        </TabPanel>
        <TabPanel>
          <TabLogs {...{
            snapshots,
            vm
          }} />
        </TabPanel>
        <TabPanel>
          <TabAdvanced {...{
            vm
          }} />
        </TabPanel>
      </Tabs>
    </div>
  }
}
