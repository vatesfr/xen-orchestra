import _, { messages } from 'intl'
import CenterPanel from 'center-panel'
import Component from 'base-component'
import Icon from 'icon'
import Link from 'link'
import React from 'react'
import SortedTable from 'sorted-table'
import { injectIntl } from 'react-intl'
import { SelectPool } from 'select-objects'
import { connectStore, resolveIds } from 'utils'
import { Card, CardBlock, CardHeader } from 'card'
import { Col, Container, Row } from 'grid'
import { flatMap, flatten, isEmpty, keys, some, toArray } from 'lodash'
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
    default: true,
    itemRenderer: (task, userData) => {
      const pool = userData.pools[task.$poolId]
      return (
        pool !== undefined && (
          <Link to={`/pools/${pool.id}`}>{pool.name_label}</Link>
        )
      )
    },
    name: _('pool'),
    sortCriteria: (task, userData) => {
      const pool = userData.pools[task.$poolId]
      return pool !== undefined && pool.name_label
    },
  },
  {
    component: TaskItem,
    name: _('task'),
    sortCriteria: 'name_label',
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
    name: _('progress'),
    sortCriteria: 'progress',
  },
]

const isNotCancelable = task => !task.allowedOperations.includes('cancel')
const isNotDestroyable = task => !task.allowedOperations.includes('destroy')

const INDIVIDUAL_ACTIONS = [
  {
    disabled: isNotCancelable,
    handler: cancelTask,
    icon: 'task-cancel',
    label: _('cancelTask'),
    level: 'danger',
  },
  {
    disabled: isNotDestroyable,
    handler: destroyTask,
    icon: 'task-destroy',
    label: _('destroyTask'),
    level: 'danger',
  },
]

const GROUPED_ACTIONS = [
  {
    disabled: tasks => some(tasks, isNotCancelable),
    handler: cancelTasks,
    icon: 'task-cancel',
    label: _('cancelTasks'),
    level: 'danger',
  },
  {
    disabled: tasks => some(tasks, isNotDestroyable),
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

  const getPools = createGetObjectsOfType('pool').pick(
    createSelector(getPendingTasksByPool, keys)
  )

  return {
    nTasks: getNPendingTasks,
    pendingTasksByPool: getPendingTasksByPool,
    pools: getPools,
  }
})
@injectIntl
export default class Tasks extends Component {
  _getTasks = createSelector(
    createSelector(() => this.state.pools, resolveIds),
    () => this.props.pendingTasksByPool,
    (poolIds, pendingTasksByPool) =>
      isEmpty(poolIds)
        ? flatten(toArray(pendingTasksByPool))
        : flatMap(poolIds, poolId => pendingTasksByPool[poolId] || [])
  )

  render () {
    const { props } = this
    const { intl, nTasks, pendingTasksByPool, pools } = props

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
            <Col mediumSize={8}>
              <SelectPool multi onChange={this.linkState('pools')} />
            </Col>
            <Col mediumSize={4}>
              <div ref={container => this.setState({ container })} />
            </Col>
          </Row>
          <Row>
            <Col>
              <SortedTable
                collection={this._getTasks()}
                columns={COLUMNS}
                filterContainer={() => this.state.container}
                groupedActions={GROUPED_ACTIONS}
                individualActions={INDIVIDUAL_ACTIONS}
                stateUrlParam='s'
                userData={{ pools }}
              />
            </Col>
          </Row>
        </Container>
      </Page>
    )
  }
}
