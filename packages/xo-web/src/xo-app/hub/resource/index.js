import ActionButton from 'action-button'
import React from 'react'
import { Card, CardBlock, CardHeader } from 'card'
import Icon from 'icon'

import { injectState, provideState } from 'reaclette'
import { Col, Row } from 'grid'
import { formatSize } from 'utils'

const withState = provideState({
  initialState: () => ({}),
  effects: {
    initialize: () => {},
  },
})

const Resource = ({ name, popularity, size, version }) => (
  <Card shadow>
    <CardHeader>{name}</CardHeader>
    <CardBlock className='text-center'>
      <div>
        <span className='text-muted'>OS</span>
        {'  '}
        <strong>Ubuntu</strong>
        <span className='pull-right'>
          {popularity} <Icon icon='plan-trial' />
        </span>
      </div>
      <div>
        <span className='text-muted'>VERSION</span>
        {'  '}
        <strong>{version}</strong>
      </div>
      <div>
        <span className='text-muted'>SIZE</span>
        {'  '}
        <strong>{formatSize(size)}</strong>
      </div>
      <br />
      <br />
      <Row>
        <Col size={6}>
          <ActionButton
            block
            //   handler={handler}
            //   handlerParam={handlerParam}
            icon={'add'}
            //   pending={pending}
            //   redirectOnSuccess={redirectOnSuccess}
            size='meduim'
            //   tooltip={display === 'icon' ? label : undefined}
          >
            Install
          </ActionButton>
        </Col>
        <Col size={6}>
          <ActionButton
            block
            //   handler={handler}
            //   handlerParam={handlerParam}
            icon={'add-vm'}
            //   pending={pending}
            //   redirectOnSuccess={redirectOnSuccess}
            size='meduim'
            //   tooltip={display === 'icon' ? label : undefined}
          >
            Deploy
          </ActionButton>
        </Col>
      </Row>
    </CardBlock>
  </Card>
)

export default withState(injectState(Resource))
