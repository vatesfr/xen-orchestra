import _ from 'messages'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import React from 'react'
import { FormattedRelative, FormattedTime } from 'react-intl'
import { Row, Col } from 'grid'

export default ({
  snapshots,
  vm
}) => <div>
  {isEmpty(vm.snapshots)
    ? <Row>
      <Col smallSize={6} className='text-xs-center'>
        <br/>
        <h4>{_('noSnapshot')}</h4>
        <p><em><i className='xo-icon-info'>&nbsp;</i>{_('tipLabel')} {_('tipCreateSnapshotLabel')}</em></p>
      </Col>
      <Col smallSize={6} className='text-xs-center'>
        <p><button type='button' className='btn btn-lg btn-secondary btn-huge'><i className='xo-icon-snapshot'></i></button></p>
      </Col>
    </Row>
    : [<Row>
      <Col smallSize={12}>
        <button className='btn btn-lg btn-primary btn-tab pull-xs-right'>{_('snapshotCreateButton')}</button>
        <br/>
        <table className='table'>
          <thead className='thead-default'>
            <tr>
              <th>{_('snapshotDate')}</th>
              <th>{_('snapshotName')}</th>
              <th>{_('snapshotAction')}</th>
            </tr>
          </thead>
          <tbody>
            {map(snapshots, (snapshot) =>
              <tr key={snapshot.id}>
                <td><FormattedTime value={snapshot.snapshot_time * 1000} minute='numeric' hour='numeric' day='numeric' month='long' year='numeric'/> (<FormattedRelative value={snapshot.snapshot_time * 1000}/>)</td>
                <td>{snapshot.name_label}</td>
                <td><i className='xo-icon-export xo-icon-action-row'></i> <i className='xo-icon-snapshot-revert xo-icon-action-row'></i> <i className='xo-icon-snapshot-delete xo-icon-action-row'></i></td>
              </tr>
            )}
          </tbody>
        </table>
      </Col>
    </Row>]
  }
</div>
