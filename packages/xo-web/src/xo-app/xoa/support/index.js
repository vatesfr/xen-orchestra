import _ from 'intl'
import ActionButton from 'action-button'
import AnsiUp from 'ansi_up'
import decorate from 'apply-decorators'
import React from 'react'
import { addSubscriptions, adminOnly, getXoaPlan } from 'utils'
import { Card, CardBlock, CardHeader } from 'card'
import { Container, Row, Col } from 'grid'
import { injectState, provideState } from 'reaclette'
import { closeTunnel, openTunnel, subscribeTunnelState } from 'xo'
import { reportOnSupportPanel } from 'report-bug-button'

const ansiUp = new AnsiUp()
const COMMUNITY = getXoaPlan() === 'Community'

const Support = decorate([
  adminOnly,
  addSubscriptions({
    tunnelState: subscribeTunnelState,
  }),
  provideState({
    computed: {
      stdoutSupportTunnel: (_, { tunnelState }) =>
        tunnelState === undefined ? undefined : { __html: ansiUp.ansi_to_html(tunnelState.stdout) },
    },
  }),
  injectState,
  ({
    effects,
    state: { stdoutSupportTunnel, xoaStatus },
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
      <Row className='mb-1'>
        <Col>
          <ActionButton btnStyle='primary' disabled={COMMUNITY} handler={reportOnSupportPanel} icon='ticket'>
            {_('createSupportTicket')}
          </ActionButton>
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
                handler={effects.forceRefreshXoaStatus}
                icon='diagnosis'
              >
                {_('checkXoa')}
              </ActionButton>
              <hr />
              <pre
                dangerouslySetInnerHTML={{
                  __html: ansiUp.ansi_to_html(xoaStatus),
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
                    <ActionButton btnStyle='primary' disabled={COMMUNITY} handler={closeTunnel} icon='remove'>
                      {_('closeTunnel')}
                    </ActionButton>
                  ) : (
                    <ActionButton btnStyle='success' disabled={COMMUNITY} handler={openTunnel} icon='open-tunnel'>
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
