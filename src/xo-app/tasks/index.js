import _, { messages } from 'intl'
import CenterPanel from 'center-panel'
import Component from 'base-component'
import Icon from 'icon'
import Link from 'link'
import React from 'react'
import SortedTable from 'sorted-table'
import { injectIntl } from 'react-intl'
import { SelectPool } from 'select-objects'
import { Card, CardBlock, CardHeader } from 'card'
import { connectStore, resolveId, resolveIds } from 'utils'
import { Col, Container, Row } from 'grid'
import { includes, isEmpty, keys, map } from 'lodash'
import {
  createGetObject,
  createGetObjectsOfType,
  createSelector,
} from 'selectors'
import { cancelTask, cancelTasks, destroyTask, destroyTasks } from 'xo'

import Page from '../page'

const HEADER = (
  <Container>
    <Row>
      <Col mediumSize={12}>
        <h2>
          <Icon icon='task' /> {_('taskMenu')}
        </h2>
      </Col>
    </Row>
  </Container>
)

const TASK_ITEM_STYLE = {
  // Remove all margin, otherwise it breaks vertical alignment.
  margin: 0,
}
@connectStore(() => ({
  host: createGetObject((_, props) => props.item.$host),
}))
export class TaskItem extends Component {
  render () {
    const { host, item: task } = this.props

    return (
      <div>
        {task.name_label} ({task.name_description &&
          `${task.name_description} `}on{' '}
        {host ? (
          <Link to={`/hosts/${host.id}`}>{host.name_label}</Link>
        ) : (
          `unknown host − ${task.$host}`
        )})
        {' ' + Math.round(task.progress * 100)}%
      </div>
    )
  }
}

const COLUMNS = [
  {
    component: TaskItem,
    default: true,
    name: _('task'),
    sortCriteria: task => task.progress,
  },
  {
    itemRenderer: task => (
      <progress
        style={TASK_ITEM_STYLE}
        className='progress'
        value={task.progress * 100}
        max='100'
      />
    ),
  },
]

const INDIVIDUAL_ACTIONS = [
  {
    handler: cancelTask,
    icon: 'task-cancel',
    label: _('cancelTask'),
    level: 'danger',
  },
  {
    handler: destroyTask,
    icon: 'task-destroy',
    label: _('destroyTask'),
    level: 'danger',
  },
]

const GROUPED_ACTIONS = [
  {
    handler: cancelTasks,
    icon: 'task-cancel',
    label: _('cancelTasks'),
    level: 'danger',
  },
  {
    handler: destroyTasks,
    icon: 'task-destroy',
    label: _('destroyTasks'),
    level: 'danger',
  },
]

@connectStore(() => {
  const getPendingTasks = createGetObjectsOfType('task').filter([
    task => task.status === 'pending',
  ])

  const getNPendingTasks = getPendingTasks.count()

  const getPendingTasksByPool = getPendingTasks.sort().groupBy('$pool')

  const getPools = createGetObjectsOfType('pool')
    .pick(createSelector(getPendingTasksByPool, keys))
    .sort()

  return {
    nTasks: getNPendingTasks,
    pendingTasksByPool: getPendingTasksByPool,
    pools: getPools,
  }
})
@injectIntl
export default class Tasks extends Component {
  _showPoolTasks = pool =>
    isEmpty(this.state.pools) ||
    includes(resolveIds(this.state.pools), resolveId(pool))

  render () {
    const { props, state } = this
    const { intl, nTasks, pendingTasksByPool } = props

    if (isEmpty(pendingTasksByPool)) {
      return (
        <Page header={HEADER} title='taskPage' formatTitle>
          <CenterPanel>
            <Card>
              <CardHeader>{_('noTasks')}</CardHeader>
              <CardBlock>
                <Row>
                  <Col>
                    <p className='text-muted'>{_('xsTasks')}</p>
                  </Col>
                </Row>
              </CardBlock>
            </Card>
          </CenterPanel>
        </Page>
      )
    }

    const { formatMessage } = intl
    return (
      <Page
        header={HEADER}
        title={`(${nTasks}) ${formatMessage(messages.taskPage)}`}
      >
        <Container>
          <Row className='mb-1'>
            <SelectPool
              multi
              value={state.pools}
              onChange={this.linkState('pools')}
            />
          </Row>
          {map(
            props.pools,
            pool =>
              this._showPoolTasks(pool) && (
                <SortedTable
                  collection={pendingTasksByPool[pool.id]}
                  columns={COLUMNS}
                  groupedActions={GROUPED_ACTIONS}
                  individualActions={INDIVIDUAL_ACTIONS}
                  stateUrlParam='s'
                />
              )
          )}
        </Container>
      </Page>
    )
  }
}
