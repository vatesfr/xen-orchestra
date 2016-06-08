import _ from 'messages'
import ActionRowButton from 'action-row-button'
import Icon from 'icon'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import SortedTable from 'sorted-table'
import TabButton from 'tab-button'
import React, { Component } from 'react'
import { confirm } from 'modal'
import { deleteMessage, deleteVdi, deleteVm } from 'xo'
import { FormattedRelative, FormattedTime } from 'react-intl'
import { Container, Row, Col } from 'grid'
import {
  createGetObject,
  createGetObjectsOfType,
  createSelector
} from 'selectors'
import {
  connectStore,
  formatSize,
  noop
} from 'utils'

const AlarmColObject = connectStore(() => ({
  object: createGetObject()
}))(({ object }) => <span>{object.name_label}</span>)

const AlarmColPool = connectStore(() => ({
  pool: createGetObject()
}))(({ pool }) => <span>{pool.name_label}</span>)

const OrphanVdiSnapshot = connectStore(() => ({
  sr: createGetObject(
    (_, props) => props.vdi.$SR
  )
}))(({ vdi, sr }) =>
  <tr>
    <td>
      <FormattedTime
        value={vdi.snapshot_time * 1000}
        minute='numeric'
        hour='numeric'
        day='numeric'
        month='long'
        year='numeric' />
      (<FormattedRelative value={vdi.snapshot_time * 1000} />)
    </td>
    <td>{vdi.name_label}</td>
    <td>{vdi.name_description}</td>
    <td>{formatSize(vdi.size)}</td>
    <td>{sr.name_label}</td>
    <td>
      <ActionRowButton
        btnStyle='danger'
        handler={deleteVdi}
        handlerParam={vdi}
        icon='delete'
        />
    </td>
  </tr>
)

const OrphanVmSnapshot = connectStore(() => ({
  container: createGetObject(
    (_, props) => props.vm.$container
  )
}))(({ container, vm }) =>
  <tr>
    <td><FormattedTime value={vm.snapshot_time * 1000} minute='numeric' hour='numeric' day='numeric' month='long' year='numeric' /> (<FormattedRelative value={vm.snapshot_time * 1000} />)</td>
    <td>{vm.name_label}</td>
    <td>{vm.name_description}</td>
    <td>{container.name_label}</td>
    <td>
      <ActionRowButton
        btnStyle='danger'
        handler={deleteVm}
        handlerParam={vm}
        icon='delete'
      />
    </td>
  </tr>
)

const Sr = connectStore(() => ({
  container: createGetObject(
    (_, props) => props.sr.$container
  )
}))(({ container, sr }) =>
  <tr>
    <td>{sr.name_label}</td>
    <td>{container.name_label}</td>
    <td>{sr.SR_type}</td>
    <td>{formatSize(sr.size)}</td>
    <td>
      {sr.size > 1 &&
        <meter value={(sr.physical_usage / sr.size) * 100} min='0' max='100' optimum='40' low='80' high='90'></meter>
      }
    </td>
  </tr>
)

const ALARM_COLUMNS = [
  {
    name: _('alarmDate'),
    itemRenderer: message => (
      <span><FormattedTime value={message.time * 1000} minute='numeric' hour='numeric' day='numeric' month='long' year='numeric' /> (<FormattedRelative value={message.time * 1000} />)</span>
    ),
    sortCriteria: message => message.time
  },
  {
    name: _('alarmContent'),
    itemRenderer: message => message.body,
    sortCriteria: message => message.body
  },
  {
    name: _('alarmObject'),
    itemRenderer: message => <AlarmColObject id={message.$object} />
  },
  {
    name: _('alarmPool'),
    itemRenderer: message => <AlarmColPool id={message.$pool} />
  },
  {
    name: _('logAction'),
    itemRenderer: message => (
      <ActionRowButton
        btnStyle='danger'
        handler={deleteMessage}
        handlerParam={message}
        icon='delete'
      />
    )
  }
]

@connectStore(() => {
  const getOrphanVdiSnapshots = createGetObjectsOfType('VDI-snapshot')
    .filter([ snapshot => !snapshot.$snapshot_of ])
    .sort()
  const getOrphanVmSnapshots = createGetObjectsOfType('VM-snapshot')
    .filter([ snapshot => !snapshot.$snapshot_of ])
    .sort()
  const getUserSrs = createGetObjectsOfType('SR')
    .filter([ sr => sr.content_type === 'user' ])
  const getVdiSrs = createGetObjectsOfType('SR')
    .pick(createSelector(
      getOrphanVdiSnapshots,
      snapshots => map(snapshots, '$SR')
    ))
  const getAlertMessages = createGetObjectsOfType('message')
    .filter([ message => message.name === 'ALARM' ])

  return {
    alertMessages: getAlertMessages,
    userSrs: getUserSrs,
    vdiOrphaned: getOrphanVdiSnapshots,
    vdiSr: getVdiSrs,
    vmOrphaned: getOrphanVmSnapshots
  }
})
export default class Health extends Component {
  _deleteOrphanedVdis = () => (
    confirm({
      title: 'Remove all orphaned VDIs',
      body: <div>
        <p>Are you sure you want to remove all orphaned VDIs?</p>
        <p>This operation is definitive.</p>
      </div>
    }).then(
      () => map(this.props.vdiOrphaned, deleteVdi),
      noop
    )
  )
  _deleteAllLogs = () => (
    confirm({
      title: 'Remove all logs',
      body: <div>
        <p>Are you sure you want to remove all logs?</p>
        <p>This operation is definitive.</p>
      </div>
    }).then(
      () => map(this.props.alertMessages, deleteMessage),
      noop
    )
  )

  render () {
    return <Container>
      <Row>
        <Col>
          <div className='card-dashboard'>
            <div className='card-header-dashboard'>
              <Icon icon='disk' /> {_('orphanedVdis')}
            </div>
            <div className='card-block'>
              {isEmpty(this.props.vdiOrphaned)
                ? <p className='text-xs-center'>{_('noOrphanedObject')}</p>
                : <div>
                  <Row>
                    <Col className='text-xs-right'>
                      <TabButton
                        btnStyle='danger'
                        handler={this._deleteOrphanedVdis}
                        icon='delete'
                        labelId='logRemoveAll'
                      />
                    </Col>
                  </Row>
                  <Row>
                    <table className='table'>
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
                        {map(this.props.vdiOrphaned, vdi =>
                          <OrphanVdiSnapshot key={vdi.id} vdi={vdi} />
                        )}
                      </tbody>
                    </table>
                  </Row>
                </div>
              }
            </div>
          </div>
        </Col>
      </Row>
      <Row>
        <Col>
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
                    {map(this.props.vmOrphaned, vm =>
                      <OrphanVmSnapshot key={vm.id} vm={vm} />
                    )}
                  </tbody>
                </table>
              }
            </div>
          </div>
        </Col>
      </Row>
      <Row>
        <Col>
          <div className='card-dashboard'>
            <div className='card-header-dashboard'>
              <Icon icon='disk' /> {_('srStatePanel')}
            </div>
            <div className='card-block'>
              {isEmpty(this.props.userSrs)
                ? <Row>
                  <Col smallSize={6} className='text-xs-center'>
                    <br />
                    <h4>{_('noSrs')}</h4>
                  </Col>
                </Row>
                : <Row>
                  <Col>
                    <table className='table'>
                      <thead className='thead-default'>
                        <tr>
                          <th>{_('srName')}</th>
                          <th>{_('srPool')}/{_('srHost')}</th>
                          <th>{_('srFormat')}</th>
                          <th>{_('srSize')}</th>
                          <th>{_('srUsage')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {map(this.props.userSrs, sr =>
                          <Sr key={sr.id} sr={sr} />
                        )}
                      </tbody>
                    </table>
                  </Col>
                </Row>
              }
            </div>
          </div>
        </Col>
      </Row>
      <Row>
        <Col>
          <div className='card-dashboard'>
            <div className='card-header-dashboard'>
              <Icon icon='alarm' /> {_('alarmMessage')}
            </div>
            <div className='card-block'>
              {isEmpty(this.props.alertMessages)
                ? <p className='text-xs-center'>{_('noAlarms')}</p>
                : <div>
                  <Row>
                    <Col className='text-xs-right'>
                      <TabButton
                        btnStyle='danger'
                        handler={this._deleteAllLogs}
                        icon='delete'
                        labelId='logRemoveAll'
                      />
                    </Col>
                  </Row>
                  <Row>
                    <Col>
                      <SortedTable collection={this.props.alertMessages} columns={ALARM_COLUMNS} />
                    </Col>
                  </Row>
                </div>
              }
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  }
}
