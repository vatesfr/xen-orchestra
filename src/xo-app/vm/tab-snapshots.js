import _ from 'messages'
import ActionRow from 'action-row'
import Icon from 'icon'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import React from 'react'
import TabButton from 'tab-button'
import { FormattedRelative, FormattedTime } from 'react-intl'
import { Row, Col } from 'grid'
import { Text } from 'editable'
import {
  deleteVm,
  editVm,
  revertSnapshot,
  snapshotVm
} from 'xo'

export default ({
  snapshots,
  vm
}) => <div>
  <Row>
    <Col smallSize={12} className='text-xs-right'>
      <TabButton
        btnStyle='primary'
        handler={() => snapshotVm(vm)}
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
                  <ActionRow
                    btnStyle='warning'
                    handler={() => revertSnapshot(snapshot)}
                    icon='snapshot-revert'
                  />
                  <ActionRow
                    btnStyle='danger'
                    handler={() => deleteVm(snapshot)}
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
