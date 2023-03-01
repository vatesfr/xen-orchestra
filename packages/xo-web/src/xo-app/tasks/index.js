import _, { messages } from 'intl'
import Collapse from 'collapse'
import Component from 'base-component'
import Icon from 'icon'
import Link from 'link'
import React from 'react'
import renderXoItem, { Pool } from 'render-xo-item'
import SortedTable from 'sorted-table'
import { addSubscriptions, connectStore, resolveIds } from 'utils'
import { FormattedDate, FormattedRelative, injectIntl } from 'react-intl'
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
import { cancelTask, cancelTasks, destroyTask, destroyTasks, subscribePermissions } from 'xo'

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

const FILTERS = {
  filterOutShortTasks: '!name_label: |(SR.scan host.call_plugin)',
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

      if (progress === 0 || progress === 1) {
        return // not yet started or already finished
      }
      return <FormattedRelative value={started + (Date.now() - started) / progress} />
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

@addSubscriptions({
  permissions: subscribePermissions,
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

  _setItemsPerPageContainer = itemsPerPageContainer => this.setState({ itemsPerPageContainer })

  render() {
    const { props } = this
    const { intl, nResolvedTasks, pools } = props
    const { formatMessage } = intl

    return (
      <Page header={HEADER} title={`(${nResolvedTasks}) ${formatMessage(messages.taskPage)}`}>
        <Container>
          <Row className='mb-1'>
            <Col mediumSize={7}>
              <SelectPool multi onChange={this.linkState('pools')} />
            </Col>
            <Col mediumSize={4}>
              <div ref={container => this.setState({ container })} />
            </Col>
            <Col mediumSize={1}>
              <div ref={this._setItemsPerPageContainer} />
            </Col>
          </Row>
          <Row>
            <Col>
              <SortedTable
                collection={this._getTasks()}
                columns={COLUMNS}
                defaultFilter='filterOutShortTasks'
                filterContainer={() => this.state.container}
                filters={FILTERS}
                itemsPerPageContainer={this._getItemsPerPageContainer}
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
                  filters={FILTERS}
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
