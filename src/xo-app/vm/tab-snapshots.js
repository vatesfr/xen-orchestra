import _ from 'intl'
import ActionRowButton from 'action-row-button'
import Icon from 'icon'
import isEmpty from 'lodash/isEmpty'
import React, { Component } from 'react'
import TabButton from 'tab-button'
import Tooltip from 'tooltip'
import { connectStore } from 'utils'
import { ButtonGroup } from 'react-bootstrap-4/lib'
import { FormattedRelative, FormattedTime } from 'react-intl'
import { Container, Row, Col } from 'grid'
import { Text } from 'editable'
import {
  includes,
  map
} from 'lodash'
import {
  createGetObjectsOfType
} from 'selectors'
import {
  copyVm,
  deleteSnapshot,
  exportVm,
  editVm,
  revertSnapshot,
  snapshotVm
} from 'xo'

@connectStore(() => ({
  snapshots: createGetObjectsOfType('VM-snapshot').pick(
    (_, props) => props.vm.snapshots
  ).sort()
}))
export default class TabSnapshot extends Component {
  render () {
    const { snapshots, vm } = this.props
    return <Container>
      <Row>
        <Col className='text-xs-right'>
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
          <Col className='text-xs-center'>
            <h4>{_('noSnapshots')}</h4>
            <p><em><Icon icon='info' size={1} /> {_('tipLabel')} {_('tipCreateSnapshotLabel')}</em></p>
          </Col>
        </Row>
        : <Row>
          <Col>
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
                    <td>
                      <FormattedTime value={snapshot.snapshot_time * 1000} minute='numeric' hour='numeric' day='numeric' month='long' year='numeric' /> (<FormattedRelative value={snapshot.snapshot_time * 1000} />)
                      {' '}
                      {includes(snapshot.tags, 'quiesce') && <Tooltip content={_('snapshotQuiesce')}><Icon icon='info' /></Tooltip>}
                    </td>
                    <td>
                      <Text value={snapshot.name_label} onChange={value => editVm(snapshot, {name_label: value})} />
                    </td>
                    <td>
                      <ButtonGroup>
                        <Tooltip content={_('copySnapshot')}>
                          <ActionRowButton
                            btnStyle='primary'
                            handler={copyVm}
                            handlerParam={snapshot}
                            icon='vm-copy'
                          />
                        </Tooltip>
                        <Tooltip content={_('exportSnapshot')}>
                          <ActionRowButton
                            btnStyle='primary'
                            handler={exportVm}
                            handlerParam={snapshot}
                            icon='export'
                          />
                        </Tooltip>
                        <Tooltip content={_('revertSnapshot')}>
                          <ActionRowButton
                            btnStyle='warning'
                            handler={revertSnapshot}
                            handlerParam={snapshot}
                            icon='snapshot-revert'
                          />
                        </Tooltip>
                        <Tooltip content={_('deleteSnapshot')}>
                          <ActionRowButton
                            btnStyle='danger'
                            handler={deleteSnapshot}
                            handlerParam={snapshot}
                            icon='delete'
                          />
                        </Tooltip>
                      </ButtonGroup>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Col>
        </Row>
      }
    </Container>
  }
}
