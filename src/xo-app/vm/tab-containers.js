import _ from 'intl'
import ActionRowButton from 'action-row-button'
import isEmpty from 'lodash/isEmpty'
import SortedTable from 'sorted-table'
import Tooltip from 'tooltip'
import React, { Component } from 'react'
import { connectStore } from 'utils'
import { ButtonGroup } from 'react-bootstrap-4/lib'
import { FormattedRelative, FormattedTime } from 'react-intl'
import { Container, Row, Col } from 'grid'
import {
  startContainer,
  stopContainer,
  pauseContainer,
  resumeContainer,
  restartContainer
} from 'xo'
import {
  createGetObjectMessages
} from 'selectors'

const CONTAINER_COLUMNS = [
  {
    name: _('containerName'),
    itemRenderer: container => container.entry.names,
    sortCriteria: container => container.entry.names,
    sortOrder: 'asc'
  },
  {
    name: _('containerCommand'),
    itemRenderer: container => container.entry.command,
    sortCriteria: container => container.entry.command
  },
  {
    name: _('containerCreated'),
    itemRenderer: container => <span><FormattedTime value={container.entry.created * 1000} minute='numeric' hour='numeric' day='numeric' month='long' year='numeric' /> (<FormattedRelative value={container.entry.created * 1000} />)</span>,
    sortCriteria: container => container.entry.created,
    sortOrder: 'desc'
  },
  {
    name: _('containerStatus'),
    itemRenderer: container => container.entry.status,
    sortCriteria: container => container.entry.status
  },
  {
    action: _('containerAction'),
    itemRenderer: (container, vm) => (
      <ButtonGroup>
        {container.entry.status === 'Up' && [
          <Tooltip key={1} content={_('containerStop')}>
            <ActionRowButton
              btnStyle='primary'
              handler={() => stopContainer(vm, container.entry.container)}
              icon='vm-stop'
            />
          </Tooltip>,
          <Tooltip key={2} content={_('containerRestart')}>
            <ActionRowButton
              btnStyle='primary'
              handler={() => restartContainer(vm, container.entry.container)}
              icon='vm-reboot'
            />
          </Tooltip>,
          <Tooltip key={3} content={_('containerPause')}>
            <ActionRowButton
              btnStyle='primary'
              handler={() => pauseContainer(vm, container.entry.container)}
              icon='vm-suspend'
            />
          </Tooltip>
        ]}
        {container.entry.status === 'Exited (137)' && <Tooltip content={_('containerStart')}>
          <ActionRowButton
            btnStyle='primary'
            handler={() => startContainer(vm, container.entry.container)}
            icon='vm-start'
          />
        </Tooltip>}
        {container.entry.status === 'Up (Paused)' && <Tooltip content={_('containerResume')}>
          <ActionRowButton
            btnStyle='primary'
            handler={() => resumeContainer(vm, container.entry.container)}
            icon='vm-start'
          />
        </Tooltip>}
      </ButtonGroup>
    )
  }
]

@connectStore(() => {
  const logs = createGetObjectMessages(
    (_, props) => props.vm
  )

  return (state, props) => ({
    logs: logs(state, props)
  })
})
export default class TabContainers extends Component {

  render () {
    const { vm } = this.props
    if (isEmpty(vm.docker.containers)) {
      return <Row>
        <Col className='text-xs-center'>
          <br />
          <h4>{_('noContainers')}</h4>
        </Col>
      </Row>
    }

    return <Container>
      <Row>
        <Col>
          <SortedTable collection={vm.docker.containers} userData={vm} columns={CONTAINER_COLUMNS} />
        </Col>
      </Row>
    </Container>
  }
}
