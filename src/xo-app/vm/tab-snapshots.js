import _ from 'intl'
import Icon from 'icon'
import React, { Component } from 'react'
import SortedTable from 'sorted-table'
import TabButton from 'tab-button'
import Tooltip from 'tooltip'
import { connectStore } from 'utils'
import { FormattedRelative, FormattedTime } from 'react-intl'
import { Container, Row, Col } from 'grid'
import { Text } from 'editable'
import {
  includes,
  isEmpty
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

const COLUMNS = [
  {
    itemRenderer: snapshot =>
      <div>
        <FormattedTime
          value={snapshot.snapshot_time * 1000}
          day='numeric'
          hour='numeric'
          minute='numeric'
          month='long'
          year='numeric'
        />
        {' '}
        (<FormattedRelative value={snapshot.snapshot_time * 1000} />)
        {' '}
        {includes(snapshot.tags, 'quiesce') &&
          <Tooltip content={_('snapshotQuiesce')}>
            <Icon icon='info' />
          </Tooltip>
        }
      </div>,
    default: true,
    name: _('snapshotDate'),
    sortCriteria: _ => _.snapshot_time
  },
  {
    itemRenderer: snapshot =>
      <Text
        onChange={value => editVm(snapshot, {name_label: value})}
        value={snapshot.name_label}
      />,
    name: _('snapshotName'),
    sortCriteria: _ => _.name_label
  }
]

const INDIVIDUAL_ACTIONS = [
  {
    handler: copyVm,
    icon: 'vm-copy',
    label: _('copySnapshot')
  },
  {
    handler: exportVm,
    icon: 'export',
    label: _('exportSnapshot')
  },
  {
    handler: revertSnapshot,
    icon: 'snapshot-revert',
    label: _('revertSnapshot'),
    level: 'warning'
  },
  {
    handler: deleteSnapshot,
    icon: 'delete',
    label: _('deleteSnapshot'),
    level: 'danger'
  }
]

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
            pending={includes(vm.current_operations, 'snapshot')}
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
            <SortedTable
              collection={snapshots}
              columns={COLUMNS}
              individualActions={INDIVIDUAL_ACTIONS}
            />
          </Col>
        </Row>
      }
    </Container>
  }
}
