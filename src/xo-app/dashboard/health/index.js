import _ from 'messages'
import filter from 'lodash/filter'
import Icon from 'icon'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import React, { Component } from 'react'
import { FormattedRelative, FormattedTime } from 'react-intl'
import { Row, Col } from 'grid'
import {
  create as createSelector,
  createSort,
  createGetObjects,
  createFilter,
  objects
} from 'selectors'
import {
  connectStore,
  formatSize,
  routes
} from 'utils'

@routes()
@connectStore(() => {
  const getVdiSnapshots = createSort(
    createFilter(objects, (object) => object.type === 'VDI-snapshot')
  )
  const getVmSnapshots = createSort(
    createFilter(objects, (object) => object.type === 'VM-snapshot')
  )
  const getVdiOrphanedSnapshots = createSelector(
    getVdiSnapshots,
    (vdiSnapshots) => {
      const orphanedVdis = filter(vdiSnapshots, (vdi) => vdi && !vdi.$snapshot_of)
      return orphanedVdis
    }
  )
  const getVmOrphanedSnapshots = createSelector(
    getVmSnapshots,
    (vmSnapshots) => {
      const orphanedVms = filter(vmSnapshots, (vm) => vm && !vm.$snapshot_of)
      return orphanedVms
    }
  )
  const getVmContainers = createGetObjects(
    createSelector(
      getVmOrphanedSnapshots,
      (vmOrphaned) => map(vmOrphaned, '$container')
    )
  )
  const getVdiSrs = createGetObjects(
    createSelector(
      getVdiOrphanedSnapshots,
      (vdiOrphaned) => map(vdiOrphaned, '$SR')
    )
  )
  return (state, props) => {
    return {
      vdiOrphaned: getVdiOrphanedSnapshots(state, props),
      vdiSnapshots: getVdiSnapshots(state, props),
      vdiSr: getVdiSrs(state, props),
      vmContainers: getVmContainers(state, props),
      vmOrphaned: getVmOrphanedSnapshots(state, props),
      vmSnapshots: getVmSnapshots(state, props)
    }
  }
})
export default class Health extends Component {
  render () {
    return <div className='container-fluid'>
      <h2><Icon icon='menu-dashboard-health' /> {_('overviewHealthDashboardPage')}</h2>
      <Row>
        <Col mediumSize={12}>
          <div className='card-dashboard'>
            <div className='card-header-dashboard'>
              <Icon icon='disk' /> {_('orphanedVdis')}
            </div>
            <div className='card-block'>
              {isEmpty(this.props.vdiOrphaned)
                ? <p className='text-xs-center'>{_('noOrphanedObject')}</p>
                : <table className='table'>
                  <thead className='thead-default'>
                    <tr>
                      <th>{_('snapshotDate')}</th>
                      <th>{_('vdiNameLabel')}</th>
                      <th>{_('vdiNameDescription')}</th>
                      <th>{_('vdiSize')}</th>
                      <th>{_('vdiSr')}</th>
                      <th>{_('logAction')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {map(this.props.vdiOrphaned, (vdi) =>
                      <tr key={vdi.id}>
                        <td><FormattedTime value={vdi.snapshot_time * 1000} minute='numeric' hour='numeric' day='numeric' month='long' year='numeric'/> (<FormattedRelative value={vdi.snapshot_time * 1000}/>)</td>
                        <td>{vdi.name_label}</td>
                        <td>{vdi.name_description}</td>
                        <td>{formatSize(vdi.size)}</td>
                        <td>{this.props.vdiSr[vdi.$SR].name_label}</td>
                        <td><i className='xo-icon-delete xo-icon-action-row'></i></td>
                      </tr>
                    )}
                  </tbody>
                </table>
              }
            </div>
          </div>
        </Col>
      </Row>
      <Row>
        <Col mediumSize={12}>
          <div className='card-dashboard'>
            <div className='card-header-dashboard'>
              <Icon icon='vm' /> {_('orphanedVms')}
            </div>
            <div className='card-block'>
              {isEmpty(this.props.vmOrphaned)
                ? <p className='text-xs-center'>{_('noOrphanedObject')}</p>
                : <table className='table'>
                  <thead className='thead-default'>
                    <tr>
                      <th>{_('snapshotDate')}</th>
                      <th>{_('vmNameLabel')}</th>
                      <th>{_('vmNameDescription')}</th>
                      <th>{_('vmContainer')}</th>
                      <th>{_('logAction')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {map(this.props.vmOrphaned, (vm) =>
                      <tr key={vm.id}>
                        <td><FormattedTime value={vm.snapshot_time * 1000} minute='numeric' hour='numeric' day='numeric' month='long' year='numeric'/> (<FormattedRelative value={vm.snapshot_time * 1000}/>)</td>
                        <td>{vm.name_label}</td>
                        <td>{vm.name_description}</td>
                        <td>{this.props.vmContainers[vm.$container].name_label}</td>
                        <td><i className='xo-icon-delete xo-icon-action-row'></i></td>
                      </tr>
                    )}
                  </tbody>
                </table>
              }
            </div>
          </div>
        </Col>
      </Row>
    </div>
  }
}
