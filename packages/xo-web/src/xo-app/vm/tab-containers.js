import _ from 'intl'
import ActionRowButton from 'action-row-button'
import ButtonGroup from 'button-group'
import isEmpty from 'lodash/isEmpty'
import React, { Component } from 'react'
import SortedTable from 'sorted-table'
import Tooltip from 'tooltip'
import { FormattedRelative, FormattedTime } from 'react-intl'
import { Container, Row, Col } from 'grid'
import { startContainer, stopContainer, pauseContainer, unpauseContainer, restartContainer } from 'xo'

const CONTAINER_COLUMNS = [
  {
    name: _('containerName'),
    itemRenderer: container => container.entry.names,
    sortCriteria: container => container.entry.names,
    sortOrder: 'asc',
  },
  {
    name: _('containerCommand'),
    itemRenderer: container => container.entry.command,
    sortCriteria: container => container.entry.command,
  },
  {
    name: _('containerCreated'),
    itemRenderer: container => (
      <span>
        <FormattedTime
          value={container.entry.created * 1000}
          minute='numeric'
          hour='numeric'
          day='numeric'
          month='long'
          year='numeric'
        />{' '}
        (<FormattedRelative value={container.entry.created * 1000} />)
      </span>
    ),
    sortCriteria: container => container.entry.created,
    sortOrder: 'desc',
  },
  {
    name: _('containerStatus'),
    itemRenderer: container => container.entry.status,
    sortCriteria: container => container.entry.status,
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
          </Tooltip>,
        ]}
        {container.entry.status === 'Exited (137)' && (
          <Tooltip content={_('containerStart')}>
            <ActionRowButton
              btnStyle='primary'
              handler={() => startContainer(vm, container.entry.container)}
              icon='vm-start'
            />
          </Tooltip>
        )}
        {container.entry.status === 'Up (Paused)' && (
          <Tooltip content={_('containerResume')}>
            <ActionRowButton
              btnStyle='primary'
              handler={() => unpauseContainer(vm, container.entry.container)}
              icon='vm-start'
            />
          </Tooltip>
        )}
      </ButtonGroup>
    ),
  },
]

export default class TabContainers extends Component {
  render() {
    const { vm } = this.props
    if (isEmpty(vm.docker.containers)) {
      return (
        <Row>
          <Col className='text-xs-center mt-1'>
            <h4>{_('noContainers')}</h4>
          </Col>
        </Row>
      )
    }

    return (
      <Container>
        <Row>
          <Col>
            <SortedTable
              collection={vm.docker.containers}
              columns={CONTAINER_COLUMNS}
              stateUrlParam='s'
              userData={vm}
            />
          </Col>
        </Row>
      </Container>
    )
  }
}
