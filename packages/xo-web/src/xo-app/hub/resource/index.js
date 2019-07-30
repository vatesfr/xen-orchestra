import { messages } from 'intl'
import ActionButton from 'action-button'
import decorate from 'apply-decorators'
import Icon from 'icon'
import React from 'react'
import { alert } from 'modal'
import { Card, CardBlock, CardHeader } from 'card'
import { injectIntl } from 'react-intl'

import { injectState, provideState } from 'reaclette'
import { Col, Row } from 'grid'
import { formatSize } from 'utils'

export default decorate([
  injectIntl,
  provideState({
    initialState: () => ({}),
    effects: {
      initialize: () => {},
      install(_, { namespace }) {
        const {
          intl: { formatMessage },
        } = this.props
        if (this.state.isFromSources) {
          alert(
            formatMessage(messages.hubResourceAlert),
            <div>
              <p>
                {formatMessage(messages.considerSubscribe, {
                  link: 'https://xen-orchestra.com',
                })}
              </p>
            </div>
          )
        }
      },
    },
    computed: {
      isFromSources: () => Number(process.env.XOA_PLAN) === 5,
    },
  }),
  injectState,
  ({ name, namespace, popularity, size, version, effects }) => (
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
              handler={effects.install}
              data-namespace={namespace}
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
  ),
])
