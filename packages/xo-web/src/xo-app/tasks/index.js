import _, { FormattedDuration, messages } from 'intl'
import Collapse from 'collapse'
import Component from 'base-component'
import Icon from 'icon'
import Link from 'link'
import React from 'react'
import renderXoItem, { Pool, renderXoItemFromId } from 'render-xo-item'
import SortedTable from 'sorted-table'
import TASK_STATUS from 'task-status'
import Tooltip from 'tooltip'
import { addSubscriptions, connectStore, NumericDate, resolveIds } from 'utils'
import { FormattedRelative, injectIntl } from 'react-intl'
import { SelectPool } from 'select-objects'
import { Col, Container, Row } from 'grid'
import { differenceBy, isEmpty, map, some } from 'lodash'
import {
  createFilter,
  createGetObject,
  createGetObjectsOfType,
  createSelector,
  getResolvedPendingTasks,
  isAdmin,
} from 'selectors'
import {
  abortXoTask,
  cancelTask,
  cancelTasks,
  deleteXoTaskLog,
  destroyTask,
  destroyTasks,
  subscribePermissions,
  subscribeXoTasks,
} from 'xo'

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
  // Remove all margin; otherwise, it breaks vertical alignment.
  margin: 0,
}

const FILTERS = {
  filterOutShortTasks: '!name_label: |(SR.scan host.call_plugin "/rrd_updates")',
  filterKeepFailed: 'status:fail',
}

@connectStore(() => ({
  host: createGetObject((_, props) => props.item.$host),
  appliesTo: createGetObject((_, props) => props.item.applies_to),
}))
export class TaskItem extends Component {
  render() {
    const { appliesTo, host, item: task } = this.props
    // garbage collection task has an uuid in the desc
    const showDesc = task.name_description && task.name_label !== 'Garbage Collection'
    return (
      <div>
        {task.name_label} ({showDesc && `${task.name_description} `}
        on {host ? <Link to={`/hosts/${host.id}`}>{host.name_label}</Link> : `unknown host − ${task.$host}`})
        {appliesTo !== undefined && (
          <span>
            , applies to <Link to={`/srs/${appliesTo.id}`}>{appliesTo.name_label}</Link>
          </span>
        )}
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
  {
    default: true,
    itemRenderer: task => <FormattedRelative value={task.created * 1000} />,
    name: _('taskStarted'),
    sortCriteria: 'created',
    sortOrder: 'desc',
  },
  {
    itemRenderer: task => {
      const started = task.created * 1000
      const { progress } = task

      const elapsed = Date.now() - started
      if (progress === 0 || progress === 1 || elapsed < 10e3) {
        return // not yet started, already finished or too early to estimate end
      }

      return <FormattedRelative value={started + elapsed / progress} />
    },
    name: _('taskEstimatedEnd'),
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
    itemRenderer: task => <NumericDate timestamp={task.disappeared} />,
    name: _('taskLastSeen'),
    sortCriteria: task => task.disappeared,
    sortOrder: 'desc',
  },
]

const XO_TASKS_COLUMNS = [
  {
    itemRenderer: task => task.properties?.name ?? task.name,
    name: _('name'),
  },
  {
    itemRenderer: task => {
      const { objectId } = task.properties ?? task
      return objectId === undefined ? null : renderXoItemFromId(task.objectId, { link: true })
    },
    name: _('object'),
  },
  {
    itemRenderer: task => {
      const progress = task.properties?.progress

      return progress === undefined ? null : (
        <progress style={TASK_ITEM_STYLE} className='progress' value={progress} max='100' />
      )
    },
    name: _('progress'),
    sortCriteria: 'progress',
  },
  {
    default: true,
    itemRenderer: task => (task.start === undefined ? null : <NumericDate timestamp={task.start} />),
    name: _('taskStarted'),
    sortCriteria: 'start',
    sortOrder: 'desc',
  },
  {
    itemRenderer: task => (task.end === undefined ? null : <FormattedDuration duration={task.end - task.start} />),
    name: _('taskDuration'),
    sortCriteria: task => task.end - task.start,
    sortOrder: 'desc',
  },
  {
    itemRenderer: task => {
      const { icon, label } = TASK_STATUS[task.status] ?? TASK_STATUS.unknown
      return (
        <Tooltip content={_(label)}>
          <Icon icon={icon} />
        </Tooltip>
      )
    },
    name: _('status'),
    sortCriteria: 'status',
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

const XO_TASKS_ACTIONS = [
  {
    handler: tasks => Promise.all(tasks.map(deleteXoTaskLog)),
    icon: 'task-destroy',
    label: _('taskDeleteLog'),
    level: 'warning',
  },
]

const XO_TASKS_INDIVIDUAL_ACTIONS = [
  {
    handler: task => window.open(task.href),
    icon: 'api',
    label: _('taskOpenRawLog'),
  },
  {
    disabled: task => !(task.status === 'pending' && task.abortionRequestedAt === undefined),
    handler: abortXoTask,
    icon: 'task-cancel',
    label: _('cancelTask'),
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

@addSubscriptions({
  permissions: subscribePermissions,
  xoTasks: subscribeXoTasks,
})
@connectStore(() => {
  const getPools = createGetObjectsOfType('pool').pick(
    createSelector(getResolvedPendingTasks, resolvedPendingTasks => resolvedPendingTasks.map(task => task.$poolId))
  )

  return (state, props) => {
    // true: useResourceSet to bypass permissions
    const resolvedPendingTasks = getResolvedPendingTasks(state, props, true)
    return {
      isAdmin: isAdmin(state, props),
      nResolvedTasks: resolvedPendingTasks.length,
      pools: getPools(state, props, true),
      resolvedPendingTasks,
    }
  }
})
@injectIntl
export default class Tasks extends Component {
  state = {
    finishedTasks: [],
  }

  componentWillReceiveProps(props) {
    const finishedTasks = differenceBy(this.props.resolvedPendingTasks, props.resolvedPendingTasks, 'id')
    if (!isEmpty(finishedTasks)) {
      this.setState({
        finishedTasks: finishedTasks
          .map(task => ({ ...task, disappeared: Date.now() }))
          .concat(this.state.finishedTasks),
      })
    }
  }

  _getPoolFilter = createSelector(
    createSelector(() => this.state.pools, resolveIds),
    poolIds => (isEmpty(poolIds) ? null : ({ $poolId }) => poolIds.includes($poolId))
  )

  _getTasks = createFilter(() => this.props.resolvedPendingTasks, this._getPoolFilter)

  _getFinishedTasks = createFilter(() => this.state.finishedTasks, this._getPoolFilter)

  _getItemsPerPageContainer = () => this.state.itemsPerPageContainer

  render() {
    const { props } = this
    const { intl, nResolvedTasks, pools } = props
    const { formatMessage } = intl

    return (
      <Page header={HEADER} title={`(${nResolvedTasks}) ${formatMessage(messages.taskPage)}`}>
        <h2>{_('poolTasks')}</h2>
        <Container>
          <Row className='mb-1'>
            <Col mediumSize={7}>
              <SelectPool multi onChange={this.linkState('pools')} />
            </Col>
            <Col mediumSize={4}>
              <div ref={container => this.setState({ filterContainer: container })} />
            </Col>
            <Col mediumSize={1}>
              <div ref={container => this.setState({ itemsPerPageContainer: container })} />
            </Col>
          </Row>
          <Row>
            <Col>
              <SortedTable
                collection={this._getTasks()}
                columns={COLUMNS}
                defaultFilter='filterOutShortTasks'
                filterContainer={() => this.state.filterContainer}
                filters={FILTERS}
                itemsPerPageContainer={() => this.state.itemsPerPageContainer}
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
                  className='mt-1'
                  collection={this._getFinishedTasks()}
                  defaultFilter='filterKeepFailed'
                  columns={FINISHED_TASKS_COLUMNS}
                  filters={FILTERS}
                  stateUrlParam='s_previous'
                />
              </Collapse>
            </Col>
          </Row>
        </Container>
        <h2 className='mt-2'>{_('xoTasks')}</h2>
        <Container>
          <Row>
            <Col>
              <SortedTable
                actions={XO_TASKS_ACTIONS}
                collection={props.xoTasks}
                columns={XO_TASKS_COLUMNS}
                individualActions={XO_TASKS_INDIVIDUAL_ACTIONS}
                stateUrlParam='s_xo'
              />
            </Col>
          </Row>
        </Container>
      </Page>
    )
  }
}
