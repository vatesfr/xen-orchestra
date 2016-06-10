import _ from 'messages'
import Icon from 'icon'
import isEmpty from 'lodash/isEmpty'
import keys from 'lodash/keys'
import Link from 'react-router/lib/Link'
import map from 'lodash/map'
import Page from '../page'
import React from 'react'
import { Card, CardBlock, CardHeader } from 'card'
import { connectStore } from 'utils'
import { Container, Row, Col } from 'grid'

import {
  createGetObject,
  createGetObjectsOfType,
  createSelector
} from 'selectors'

const HEADER = <Container>
  <Row>
    <Col mediumSize={12}>
      <h2><Icon icon='task' /> {_('taskMenu')}</h2>
    </Col>
  </Row>
</Container>

export const TaskItem = connectStore(() => ({
  host: createGetObject((_, props) => props.task.$host)
}))(({ task, host }) => <span>
  <Col mediumSize={6}>
    {task.name_label} (on <Link to={`/hosts/${host.id}`}>{host.name_label}</Link>)
  </Col>
  <Col mediumSize={6}>
    <progress className='progress' value={task.progress * 100} max='100'></progress>
  </Col>
</span>)

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
      <p className='text-muted'>No pending tasks.</p>
    </Page>
  }

  return <Page header={HEADER}>
    <Card>
      {map(pools, pool =>
        <span>
          <CardHeader key={pool.id}><Link to={`/pools/${pool.id}`}>{pool.name_label}</Link></CardHeader>
          <CardBlock>
            <Row>
              {map(pendingTasksByPool[pool.id], task =>
                <TaskItem key={task.id} task={task} />
              )}
            </Row>
          </CardBlock>
        </span>
      )}
    </Card>
  </Page>
})
