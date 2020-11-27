import _, { messages } from 'intl'
import Collapse from 'collapse'
import Component from 'base-component'
import defined from '@xen-orchestra/defined'
import Icon from 'icon'
import Link from 'link'
import React from 'react'
import renderXoItem, { Pool } from 'render-xo-item'
import SortedTable from 'sorted-table'
import { FormattedDate, injectIntl } from 'react-intl'
import { SelectPool } from 'select-objects'
import { connectStore, resolveIds } from 'utils'
import { Col, Container, Row } from 'grid'
import { differenceBy, flatMap, flatten, forOwn, groupBy, isEmpty, keys, map, some, toArray } from 'lodash'
import { createFilter, createGetObject, createGetObjectsOfType, createSelector } from 'selectors'
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

const Ul = props => <ul {...props} style={{ listStyleType: 'none' }} />
const Li = props => (
  <li
    {...props}
    style={{
      whiteSpace: 'nowrap',
    }}
  />
)

const TASK_ITEM_STYLE = {
  // Remove all margin, otherwise it breaks vertical alignment.
  margin: 0,
}
@connectStore(() => ({
  host: createGetObject((_, props) => props.item.$host),
}))
export class TaskItem extends Component {
  render() {
    const { host, item: task } = this.props

    return (
      <div>
        {task.name_label} ({task.name_description && `${task.name_description} `}
        on {host ? <Link to={`/hosts/${host.id}`}>{host.name_label}</Link> : `unknown host − ${task.$host}`})
        {task.disappeared === undefined && ` ${Math.round(task.progress * 100)}%`}
      </div>
    )
  }
}

const taskObjectsRenderer = ({ objects }) => (
  <Ul>
    {map(objects, obj => {
      const { id, type } = obj
      return type === 'VDI' || type === 'network' ? (
        <Li key={id}>{renderXoItem(obj)}</Li>
      ) : (
        <Li key={id}>
          <Link to={`/${type}s/${id}`}>{renderXoItem(obj)}</Link>
        </Li>
      )
    })}
  </Ul>
)

const COMMON = [
  {
    component: TaskItem,
    name: _('task'),
    sortCriteria: 'name_label',
  },
  {
    itemRenderer: taskObjectsRenderer,
    name: _('objects'),
  },
]

const COLUMNS = [
  {
    default: true,
    itemRenderer: ({ $poolId }) => <Pool id={$poolId} link />,
    name: _('pool'),
    sortCriteria: (task, userData) => {
      const pool = userData.pools[task.$poolId]
      return pool !== undefined && pool.name_label
    },
  },
  ...COMMON,
  {
    itemRenderer: task => (
      <progress style={TASK_ITEM_STYLE} className='progress' value={task.progress * 100} max='100' />
    ),
    name: _('progress'),
    sortCriteria: 'progress',
  },
]

const FINISHED_TASKS_COLUMNS = [
  {
    itemRenderer: ({ $poolId }) => <Pool id={$poolId} link />,
    name: _('pool'),
  },
  ...COMMON,
  {
    default: true,
    itemRenderer: task => <FormattedDate value={task.disappeared} hour='2-digit' minute='2-digit' second='2-digit' />,
    name: _('taskLastSeen'),
    sortCriteria: task => task.disappeared,
    sortOrder: 'desc',
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
  const getPendingTasks = createGetObjectsOfType('task').filter([task => task.status === 'pending'])

  const getNPendingTasks = getPendingTasks.count()

  const predicate = obj => !isEmpty(obj.current_operations)

  const getLinkedObjectsByTaskRefOrId = createSelector(
    createGetObjectsOfType('pool').filter([predicate]),
    createGetObjectsOfType('host').filter([predicate]),
    createGetObjectsOfType('SR').filter([predicate]),
    createGetObjectsOfType('VDI').filter([predicate]),
    createGetObjectsOfType('VM').filter([predicate]),
    createGetObjectsOfType('network').filter([predicate]),
    (pools, hosts, srs, vdis, vms, networks) => {
      const linkedObjectsByTaskRefOrId = {}
      const resolveLinkedObjects = obj => {
        Object.keys(obj.current_operations).forEach(task => {
          if (linkedObjectsByTaskRefOrId[task] === undefined) {
            linkedObjectsByTaskRefOrId[task] = []
          }
          linkedObjectsByTaskRefOrId[task].push(obj)
        })
      }

      forOwn(pools, resolveLinkedObjects)
      forOwn(hosts, resolveLinkedObjects)
      forOwn(srs, resolveLinkedObjects)
      forOwn(vdis, resolveLinkedObjects)
      forOwn(vms, resolveLinkedObjects)
      forOwn(networks, resolveLinkedObjects)

      return linkedObjectsByTaskRefOrId
    }
  )

  const getPendingTasksByPool = createSelector(
    getPendingTasks,
    getLinkedObjectsByTaskRefOrId,
    (tasks, linkedObjectsByTaskRefOrId) =>
      groupBy(
        map(tasks, task => ({
          ...task,
          objects: [
            ...defined(linkedObjectsByTaskRefOrId[task.xapiRef], []),
            // for VMs, the current_operations prop is
            // { taskId → operation } map instead of { taskRef → operation } map
            ...defined(linkedObjectsByTaskRefOrId[task.id], []),
          ],
        })),
        '$pool'
      )
  )

  const getPools = createGetObjectsOfType('pool').pick(createSelector(getPendingTasksByPool, keys))

  return {
    nTasks: getNPendingTasks,
    pendingTasksByPool: getPendingTasksByPool,
    pools: getPools,
  }
})
@injectIntl
export default class Tasks extends Component {
  state = {
    finishedTasks: [],
  }

  componentWillReceiveProps(props) {
    const finishedTasks = differenceBy(
      flatten(toArray(this.props.pendingTasksByPool)),
      flatten(toArray(props.pendingTasksByPool)),
      'id'
    )
    if (!isEmpty(finishedTasks)) {
      this.setState({
        finishedTasks: finishedTasks
          .map(task => ({ ...task, disappeared: Date.now() }))
          .concat(this.state.finishedTasks),
      })
    }
  }

  _getTasks = createSelector(
    createSelector(() => this.state.pools, resolveIds),
    () => this.props.pendingTasksByPool,
    (poolIds, pendingTasksByPool) =>
      isEmpty(poolIds)
        ? flatten(toArray(pendingTasksByPool))
        : flatMap(poolIds, poolId => pendingTasksByPool[poolId] || [])
  )

  _getFinishedTasks = createFilter(
    () => this.state.finishedTasks,
    createSelector(
      createSelector(() => this.state.pools, resolveIds),
      poolIds => (isEmpty(poolIds) ? null : ({ $poolId }) => poolIds.includes($poolId))
    )
  )

  render() {
    const { props } = this
    const { intl, nTasks, pools } = props
    const { formatMessage } = intl

    return (
      <Page header={HEADER} title={`(${nTasks}) ${formatMessage(messages.taskPage)}`}>
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
          <Row>
            <Col>
              <Collapse buttonText={_('previousTasks')}>
                <SortedTable
                  collection={this._getFinishedTasks()}
                  columns={FINISHED_TASKS_COLUMNS}
                  stateUrlParam='s_previous'
                />
              </Collapse>
            </Col>
          </Row>
        </Container>
      </Page>
    )
  }
}
