import _ from 'messages'
import ActionRowButton from 'action-row-button'
import Icon from 'icon'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import React, { Component } from 'react'
import TabButton from 'tab-button'
import { connectStore } from 'utils'
import { FormattedRelative, FormattedTime } from 'react-intl'
import { Row, Col } from 'grid'
import { Text } from 'editable'
import {
  createGetObjectsOfType
} from 'selectors'
import {
  deleteVm,
  editVm,
  revertSnapshot,
  snapshotVm
} from 'xo'

@connectStore(() => {
  const snapshots = createGetObjectsOfType(
    'VM-snapshot',
    (_, props) => props.vm.snapshots
  ).sort()

  return (state, props) => ({
    snapshots: snapshots(state, props)
  })
})
export default class TabSnapshot extends Component {
  render () {
    const { snapshots, vm } = this.props

    return <div>
      <Row>
        <Col smallSize={12} className='text-xs-right'>
          <TabButton
            btnStyle='primary'
            handler={snapshotVm}
            handlerParam={vm}
            icon='add'
            labelId='snapshotCreateButton'
          />
        </Col>
      </Row>
      {isEmpty(snapshots)
        ? <Row>
          <Col smallSize={12} className='text-xs-center'>
            <h4>{_('noSnapshots')}</h4>
            <p><em><Icon icon='info' size={1} /> {_('tipLabel')} {_('tipCreateSnapshotLabel')}</em></p>
          </Col>
        </Row>
        : <Row>
          <Col smallSize={12}>
            <table className='table'>
              <thead className='thead-default'>
                <tr>
                  <th>{_('snapshotDate')}</th>
                  <th>{_('snapshotName')}</th>
                  <th>{_('snapshotAction')}</th>
                </tr>
              </thead>
              <tbody>
                {map(snapshots, snapshot =>
                  <tr key={snapshot.id}>
                    <td><FormattedTime value={snapshot.snapshot_time * 1000} minute='numeric' hour='numeric' day='numeric' month='long' year='numeric' /> (<FormattedRelative value={snapshot.snapshot_time * 1000} />)</td>
                    <td>
                      <Text onChange={value => editVm(snapshot, {name_label: value})}>
                        {snapshot.name_label}
                      </Text>
                    </td>
                    <td>
                      <ActionRowButton
                        btnStyle='warning'
                        handler={revertSnapshot}
                        handlerParam={snapshot}
                        icon='snapshot-revert'
                      />
                      <ActionRowButton
                        btnStyle='danger'
                        handler={deleteVm}
                        handlerParam={snapshot}
                        icon='delete'
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Col>
        </Row>
      }
    </div>
  }
}
