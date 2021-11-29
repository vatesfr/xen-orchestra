import _ from 'intl'
import copy from 'copy-to-clipboard'
import Icon from 'icon'
import React, { Component } from 'react'
import SortedTable from 'sorted-table'
import TabButton from 'tab-button'
import Tooltip from 'tooltip'
import { connectStore } from 'utils'
import { Text } from 'editable'
import { createGetObjectsOfType } from 'selectors'
import { FormattedRelative, FormattedTime } from 'react-intl'
import { includes, isEmpty } from 'lodash'
import { Container, Row, Col } from 'grid'
import {
  copyToTemplate,
  copyVm,
  deleteSnapshot,
  deleteSnapshots,
  exportVdi,
  exportVm,
  editVm,
  isCheckpointSnapshot,
  revertSnapshot,
  snapshotVm,
} from 'xo'

const COLUMNS = [
  {
    itemRenderer: (snapshot, { parent }) => (
      <div>
        <FormattedTime
          value={snapshot.snapshot_time * 1000}
          day='numeric'
          hour='numeric'
          minute='numeric'
          month='long'
          year='numeric'
        />{' '}
        (<FormattedRelative value={snapshot.snapshot_time * 1000} />){' '}
        {includes(snapshot.tags, 'quiesce') && (
          <Tooltip content={_('snapshotQuiesce')}>
            <Icon icon='info' />
          </Tooltip>
        )}
        {snapshot.id === parent && (
          <Tooltip content={_('currentSnapshot')}>
            <Icon icon='snapshot-current-state' />
          </Tooltip>
        )}
      </div>
    ),
    default: true,
    name: _('snapshotDate'),
    sortCriteria: _ => _.snapshot_time,
    sortOrder: 'desc',
  },
  {
    itemRenderer: snapshot => (
      <div>
        <Text onChange={value => editVm(snapshot, { name_label: value })} value={snapshot.name_label} />{' '}
        {isCheckpointSnapshot(snapshot) && (
          <Tooltip content={_('snapshotMemorySaved')}>
            <Icon icon='memory' color='text-success' />
          </Tooltip>
        )}
      </div>
    ),
    name: _('snapshotName'),
    sortCriteria: _ => _.name_label,
  },
  {
    itemRenderer: snapshot => (
      <Text onChange={value => editVm(snapshot, { name_description: value })} value={snapshot.name_description} />
    ),
    name: _('snapshotDescription'),
    sortCriteria: _ => _.name_description,
  },
]

const GROUPED_ACTIONS = [
  {
    handler: deleteSnapshots,
    icon: 'delete',
    label: _('deleteSnapshots'),
    level: 'danger',
  },
]

const INDIVIDUAL_ACTIONS = [
  {
    handler: snapshot => copyVm(snapshot),
    icon: 'vm-copy',
    label: _('copySnapshot'),
    redirectOnSuccess: vm => vm && `/vms/${vm}/general`,
  },
  {
    handler: exportVm,
    icon: 'export',
    label: _('exportSnapshot'),
  },
  {
    collapsed: true,
    disabled: snapshot => !isCheckpointSnapshot(snapshot),
    handler: ({ suspendVdi }) => exportVdi(suspendVdi),
    icon: 'memory',
    label: _('exportSnapshotMemory'),
  },
  {
    collapsed: true,
    handler: copyToTemplate,
    icon: 'template',
    label: _('copyToTemplate'),
  },
  {
    handler: revertSnapshot,
    icon: 'snapshot-revert',
    label: _('revertSnapshot'),
    level: 'warning',
  },
  {
    handler: snapshot => copy(snapshot.uuid),
    icon: 'clipboard',
    label: snapshot => _('copyUuid', { uuid: snapshot.uuid }),
  },
  {
    handler: deleteSnapshot,
    icon: 'delete',
    label: _('deleteSnapshot'),
    level: 'danger',
  },
]

const _snapshotVmWithMemory = vm => snapshotVm(vm, undefined, true) // undefined: name is generated on the server side

@connectStore(() => ({
  snapshots: createGetObjectsOfType('VM-snapshot')
    .pick((_, props) => props.vm.snapshots)
    .sort(),
}))
export default class TabSnapshot extends Component {
  render() {
    const { snapshots, vm } = this.props
    return (
      <Container>
        <Row>
          <Col className='text-xs-right'>
            {vm.power_state !== 'Halted' && (
              <TabButton
                btnStyle='warning'
                handler={_snapshotVmWithMemory}
                handlerParam={vm}
                icon='memory'
                labelId='newSnapshotWithMemory'
                pending={includes(vm.current_operations, 'checkpoint')}
              />
            )}
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
        {isEmpty(snapshots) ? (
          <Row>
            <Col className='text-xs-center'>
              <h4>{_('noSnapshots')}</h4>
              <p>
                <em>
                  <Icon icon='info' size={1} /> {_('tipLabel')} {_('tipCreateSnapshotLabel')}
                </em>
              </p>
            </Col>
          </Row>
        ) : (
          <Row>
            <Col>
              <SortedTable
                collection={snapshots}
                columns={COLUMNS}
                data-parent={vm.parent}
                groupedActions={GROUPED_ACTIONS}
                individualActions={INDIVIDUAL_ACTIONS}
                stateUrlParam='s'
              />
            </Col>
          </Row>
        )}
      </Container>
    )
  }
}
