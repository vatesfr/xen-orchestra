import _ from 'messages'
import filter from 'lodash/filter'
import Icon from 'icon'
import isEmpty from 'lodash/isEmpty'
import React, { Component } from 'react'
import { Row, Col } from 'grid'
import {
  create as createSelector,
  createSort,
  createFilter,
  objects
} from 'selectors'
import {
  connectStore,
  Debug,
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
  return (state, props) => {
    return {
      vdiOrphaned: getVdiOrphanedSnapshots(state, props),
      vdiSnapshots: getVdiSnapshots(state, props),
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
        <Col mediumSize={6}>
          <div className='card-dashboard'>
            <div className='card-header-dashboard'>
              <Icon icon='disk' /> {_('orphanedVdis')}
            </div>
            <div className='card-block'>
              {isEmpty(this.props.vdiOrphaned)
                ? <p>{_('noOrphanedObject')}</p>
                : <Debug value={this.props.vdiOrphaned} />
              }
            </div>
          </div>
        </Col>
        <Col mediumSize={6}>
          <div className='card-dashboard'>
            <div className='card-header-dashboard'>
              <Icon icon='vm' /> {_('orphanedVms')}
            </div>
            <div className='card-block'>
              {isEmpty(this.props.vmOrphaned)
                ? <p>{_('noOrphanedObject')}</p>
                : <Debug value={this.props.vmOrphaned} />
              }
            </div>
          </div>
        </Col>
      </Row>
    </div>
  }
}
