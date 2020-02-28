import _ from 'intl'
import ActionButton from 'action-button'
import AnsiUp from 'ansi_up'
import decorate from 'apply-decorators'
import Icon from 'icon'
import React from 'react'
import { addSubscriptions, adminOnly, getXoaPlan } from 'utils'
import { Card, CardBlock, CardHeader } from 'card'
import { Container, Row, Col } from 'grid'
import { injectState, provideState } from 'reaclette'
import { checkXoa, closeTunnel, openTunnel, subscribeTunnelState } from 'xo'

const ansiUp = new AnsiUp()
const COMMUNITY = getXoaPlan() === 'Community'

const Support = decorate([
  adminOnly,
  addSubscriptions({
    tunnelState: subscribeTunnelState,
  }),
  provideState({
    initialState: () => ({ stdoutCheckXoa: '' }),
    effects: {
      initialize: async () => ({
        stdoutCheckXoa: COMMUNITY ? '' : await checkXoa(),
      }),
      checkXoa: async () => ({ stdoutCheckXoa: await checkXoa() }),
    },
    computed: {
      stdoutSupportTunnel: (_, { tunnelState }) =>
        tunnelState === undefined
          ? undefined
          : { __html: ansiUp.ansi_to_html(tunnelState.stdout) },
    },
  }),
  injectState,
  ({
    effects,
    state: { stdoutCheckXoa, stdoutSupportTunnel },
    tunnelState: { open, stdout } = { open: false, stdout: '' },
  }) => (
    <Container>
      {COMMUNITY && (
        <Row className='mb-2'>
          <Col>
            <span className='text-info'>{_('supportCommunity')}</span>
          </Col>
        </Row>
      )}
      <Row>
        <Col>
          <p>
            <a href='https://support.vates.fr/#/createTicket'>
              <Icon icon='add' /> <span>{_('createSupportTicket')}</span>
            </a>
          </p>
        </Col>
      </Row>
      <Row>
        <Col mediumSize={6}>
          <Card>
            <CardHeader>{_('xoaCheck')}</CardHeader>
            <CardBlock>
              <ActionButton
                btnStyle='success'
                disabled={COMMUNITY}
                handler={effects.checkXoa}
                icon='diagnosis'
              >
                {_('checkXoa')}
              </ActionButton>
              <hr />
              <pre
                dangerouslySetInnerHTML={{
                  __html: ansiUp.ansi_to_html(stdoutCheckXoa),
                }}
              />
            </CardBlock>
          </Card>
        </Col>
        <Col mediumSize={6}>
          <Card>
            <CardHeader>{_('supportTunnel')}</CardHeader>
            <CardBlock>
              <Row>
                <Col>
                  {open ? (
                    <ActionButton
                      btnStyle='primary'
                      disabled={COMMUNITY}
                      handler={closeTunnel}
                      icon='remove'
                    >
                      {_('closeTunnel')}
                    </ActionButton>
                  ) : (
                    <ActionButton
                      btnStyle='success'
                      disabled={COMMUNITY}
                      handler={openTunnel}
                      icon='open-tunnel'
                    >
                      {_('openTunnel')}
                    </ActionButton>
                  )}
                </Col>
              </Row>
              <hr />
              {open || stdout !== '' ? (
                <pre
                  className={!open && stdout !== '' && 'text-danger'}
                  dangerouslySetInnerHTML={stdoutSupportTunnel}
                />
              ) : (
                <span>{_('supportTunnelClosed')}</span>
              )}
            </CardBlock>
          </Card>
        </Col>
      </Row>
    </Container>
  ),
])

export default Support
