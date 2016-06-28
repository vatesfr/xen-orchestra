import _ from 'intl'
import ActionRowButton from 'action-row-button'
import CenterPanel from 'center-panel'
import Icon from 'icon'
import isEmpty from 'lodash/isEmpty'
import keys from 'lodash/keys'
import Link from 'react-router/lib/Link'
import map from 'lodash/map'
import React from 'react'
import SingleLineRow from 'single-line-row'
import { ButtonGroup } from 'react-bootstrap-4/lib'
import { Card, CardBlock, CardHeader } from 'card'
import { connectStore } from 'utils'
import { Container, Row, Col } from 'grid'
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

const HEADER = <Container>
  <Row>
    <Col mediumSize={12}>
      <h2><Icon icon='task' /> {_('taskMenu')}</h2>
    </Col>
  </Row>
</Container>

const TASK_ITEM_STYLE = {
  // Remove all margin, otherwise it breaks vertical alignment.
  margin: 0
}

export const TaskItem = connectStore(() => ({
  host: createGetObject((_, props) => props.task.$host)
}))(({ task, host }) => <SingleLineRow>
  <Col mediumSize={6}>
    {task.name_label} (on <Link to={`/hosts/${host.id}`}>{host.name_label}</Link>)
    {' ' + Math.round(task.progress * 100)}%
  </Col>
  <Col mediumSize={4}>
    <progress style={TASK_ITEM_STYLE} className='progress' value={task.progress * 100} max='100'></progress>
  </Col>
  <Col mediumSize={2}>
    <ButtonGroup>
      <ActionRowButton
        btnStyle='default'
        handler={cancelTask}
        handlerParam={task}
        icon='task-cancel'
      />
      <ActionRowButton
        btnStyle='default'
        handler={destroyTask}
        handlerParam={task}
        icon='task-destroy'
      />
    </ButtonGroup>
  </Col>
</SingleLineRow>)

export default connectStore(() => {
  const getPendingTasksByPool = createGetObjectsOfType('task').filter(
    [ task => task.status === 'pending' ]
  ).sort().groupBy('$pool')

  const getPools = createGetObjectsOfType('pool').pick(
    createSelector(
      getPendingTasksByPool,
      pendingTasksByPool => keys(pendingTasksByPool)
    )
  ).sort()

  return (state, props) => ({
    pendingTasksByPool: getPendingTasksByPool(state, props),
    pools: getPools(state, props)
  })
})(({ pendingTasksByPool, pools }) => {
  if (isEmpty(pendingTasksByPool)) {
    return <Page header={HEADER}>
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
  }

  return <Page header={HEADER}>
    <Container>
      {map(pools, pool =>
        <Row>
          <Card>
            <CardHeader key={pool.id}><Link to={`/pools/${pool.id}`}>{pool.name_label}</Link></CardHeader>
            <CardBlock>
              {map(pendingTasksByPool[pool.id], task =>
                <TaskItem key={task.id} task={task} />
              )}
            </CardBlock>
          </Card>
        </Row>
      )}
    </Container>
  </Page>
})
