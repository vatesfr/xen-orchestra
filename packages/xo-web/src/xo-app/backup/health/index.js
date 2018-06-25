import _ from 'intl'
import Component from 'base-component'
import Icon from 'icon'
import NoObjects from 'no-objects'
import React from 'react'
import SortedTable from 'sorted-table'
import { Card, CardHeader, CardBlock } from 'card'
import { connectStore } from 'utils'
import { Container, Row, Col } from 'grid'
import { FormattedRelative, FormattedTime } from 'react-intl'
import { includes, map } from 'lodash'
import { deleteSnapshot, deleteSnapshots } from 'xo'
import {
  createGetObject,
  createSelector,
  createGetObjectsOfType,
  createCollectionWrapper,
} from 'selectors'

const VmColContainer = connectStore(() => ({
  container: createGetObject(),
}))(({ container }) => <span>{container.name_label}</span>)

const SNAPSHOT_COLUMNS = [
  {
    name: _('snapshotDate'),
    itemRenderer: vm => (
      <span>
        <FormattedTime
          day='numeric'
          hour='numeric'
          minute='numeric'
          month='long'
          value={vm.snapshot_time * 1000}
          year='numeric'
        />{' '}
        (<FormattedRelative value={vm.snapshot_time * 1000} />)
      </span>
    ),
    sortCriteria: vm => vm.snapshot_time,
    sortOrder: 'desc',
  },
  {
    name: _('vmNameLabel'),
    itemRenderer: vm => vm.name_label,
    sortCriteria: vm => vm.name_label,
  },
  {
    name: _('vmNameDescription'),
    itemRenderer: vm => vm.name_description,
    sortCriteria: vm => vm.name_description,
  },
  {
    name: _('vmContainer'),
    itemRenderer: vm => <VmColContainer id={vm.$container} />,
  },
]

const ACTIONS = [
  {
    label: _('deleteSnapshots'),
    individualLabel: _('deleteSnapshot'),
    icon: 'delete',
    level: 'danger',
    handler: deleteSnapshots,
    individualHandler: deleteSnapshot,
  },
]

@connectStore(() => {
  const getSnapshots = createGetObjectsOfType('VM-snapshot')

  return {
    loneSnapshots: getSnapshots.filter(
      createSelector(
        createCollectionWrapper((_, props) => map(props.schedules, 'id')),
        scheduleIds => _ => {
          const scheduleId = _.other['xo:backup:schedule']
          return scheduleId !== undefined && !includes(scheduleIds, scheduleId)
        }
      )
    ),
  }
})
export default class Health extends Component {
  render () {
    return (
      <Container>
        <Row className='lone-snapshots'>
          <Col>
            <Card>
              <CardHeader>
                <Icon icon='vm' /> {_('vmSnapshotsRelatedToNonExistentBackups')}
              </CardHeader>
              <CardBlock>
                <NoObjects
                  actions={ACTIONS}
                  collection={this.props.loneSnapshots}
                  columns={SNAPSHOT_COLUMNS}
                  component={SortedTable}
                  emptyMessage={_('noSnapshots')}
                  shortcutsTarget='.lone-snapshots'
                />
              </CardBlock>
            </Card>
          </Col>
        </Row>
      </Container>
    )
  }
}
