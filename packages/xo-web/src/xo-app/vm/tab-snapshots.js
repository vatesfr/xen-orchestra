import _ from 'intl'
import copy from 'copy-to-clipboard'
import Icon from 'icon'
import React, { Component } from 'react'
import SortedTable from 'sorted-table'
import TabButton from 'tab-button'
import Tooltip from 'tooltip'
import { connectStore } from 'utils'
import { FormattedRelative, FormattedTime } from 'react-intl'
import { Container, Row, Col } from 'grid'
import { Text } from 'editable'
import { includes, isEmpty } from 'lodash'
import {
  createSelector,
  createGetObjectsOfType,
  getCheckPermissions,
} from 'selectors'
import {
  cloneVm,
  copyVm,
  deleteSnapshot,
  deleteSnapshots,
  exportVm,
  editVm,
  revertSnapshot,
  snapshotVm,
} from 'xo'

const COLUMNS = [
  {
    itemRenderer: snapshot => (
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
      </div>
    ),
    default: true,
    name: _('snapshotDate'),
    sortCriteria: _ => _.snapshot_time,
    sortOrder: 'desc',
  },
  {
    itemRenderer: snapshot => (
      <Text
        onChange={value => editVm(snapshot, { name_label: value })}
        value={snapshot.name_label}
      />
    ),
    name: _('snapshotName'),
    sortCriteria: _ => _.name_label,
  },
  {
    itemRenderer: snapshot => (
      <Text
        onChange={value => editVm(snapshot, { name_description: value })}
        value={snapshot.name_description}
      />
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
  },
]

const INDIVIDUAL_ACTIONS = [
  {
    handler: snapshot => copyVm(snapshot),
    icon: 'vm-copy',
    label: _('copySnapshot'),
  },
  {
    disabled: (snapshot, { canAdministrate }) => !canAdministrate(snapshot),
    handler: snapshot => cloneVm(snapshot, false),
    icon: 'vm-fast-clone',
    label: _('fastCloneVmLabel'),
    redirectOnSuccess: snapshot => `/vms/${snapshot}/general`,
  },
  {
    handler: exportVm,
    icon: 'export',
    label: _('exportSnapshot'),
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

@connectStore(() => ({
  checkPermissions: getCheckPermissions,
  snapshots: createGetObjectsOfType('VM-snapshot')
    .pick((_, props) => props.vm.snapshots)
    .sort(),
}))
export default class TabSnapshot extends Component {
  _getCanAdministrate = createSelector(
    () => this.props.checkPermissions,
    check => vm => check(vm.id, 'administrate')
  )

  render () {
    const { snapshots, vm } = this.props
    return (
      <Container>
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
        {isEmpty(snapshots) ? (
          <Row>
            <Col className='text-xs-center'>
              <h4>{_('noSnapshots')}</h4>
              <p>
                <em>
                  <Icon icon='info' size={1} /> {_('tipLabel')}{' '}
                  {_('tipCreateSnapshotLabel')}
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
                data-canAdministrate={this._getCanAdministrate()}
                groupedActions={GROUPED_ACTIONS}
                individualActions={INDIVIDUAL_ACTIONS}
              />
            </Col>
          </Row>
        )}
      </Container>
    )
  }
}
