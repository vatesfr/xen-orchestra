import _, { messages } from 'intl'
import ActionRowButton from 'action-row-button'
import ButtonGroup from 'button-group'
import CenterPanel from 'center-panel'
import Component from 'base-component'
import Icon from 'icon'
import Link from 'link'
import React from 'react'
import SingleLineRow from 'single-line-row'
import { injectIntl } from 'react-intl'
import { SelectPool } from 'select-objects'
import {
  connectStore,
  resolveId,
  resolveIds
} from 'utils'
import {
  includes,
  isEmpty,
  keys,
  map
} from 'lodash'
import {
  createGetObject,
  createGetObjectsOfType,
  createSelector
} from 'selectors'
import {
  cancelTask,
  destroyTask
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

const TASK_ITEM_STYLE = {
  // Remove all margin, otherwise it breaks vertical alignment.
  margin: 0
}

@connectStore(() => ({
  host: createGetObject((_, props) => props.item.$host)
}))
export class TaskItem extends Component {
  render () {
    return <div>
      {this.props.item.name_label} ({this.props.item.name_description && `${this.props.item.name_description} `}on {this.props.host
        ? <Link to={`/hosts/${this.props.host.id}`}>{this.props.host.name_label}</Link>
        : `unknown host − ${this.props.item.$host}`
      })
      {' ' + Math.round(this.props.item.progress * 100)}%
      </div>
  }
}

const COLUMNS = [
  {
    component: TaskItem,
    default: true,
    name: _('task'),
    sortCriteria: task => task.progress
  },
  {
    itemRenderer: task => <progress style={TASK_ITEM_STYLE} className='progress' value={task.progress * 100} max='100' />
  }
]

const INDIVIDUAL_ACTIONS = [
  {
    handler: cancelTask,
    icon: 'task-cancel',
    label: _('cancelTask')
  },
  {
    handler: {destroyTask},
    icon: 'task-destroy',
    label: _('destroyTask')
  }
]

const GROUPED_ACTIONS = [
  {
    handler: tasks => map(tasks, task => cancelTask(task)),
    icon: 'task-cancel',
    label: _('cancelTasks')
  },
  {
    handler: tasks => map(tasks, task => destroyTask(task)),
    icon: 'task-destroy',
    label: _('destroyTasks')
  }
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
    const {
      pendingTasksByPool
    } = props

    return  ( <div>
      <br /><br />
      <SelectPool
        multi
        value={state.pools}
        onChange={this.linkState('pools')}
      />
      <br /><br />
      {map(props.pools, pool => this._showPoolTasks(pool) && <SortedTable
        collection={pendingTasksByPool[pool.id]}
        columns={COLUMNS}
        groupedActions={GROUPED_ACTIONS}
        individualActions={INDIVIDUAL_ACTIONS}
        stateUrlParam='s'
      />)}
    </div>
  }
}
