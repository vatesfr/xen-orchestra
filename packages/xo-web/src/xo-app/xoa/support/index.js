import _ from 'intl'
import ActionButton from 'action-button'
import AnsiUp from 'ansi_up'
import decorate from 'apply-decorators'
import React from 'react'
import { adminOnly } from 'utils'
import { Card, CardBlock, CardHeader } from 'card'
import { Container, Row, Col } from 'grid'
import { injectState, provideState } from 'reaclette'
import { getCheckXoa } from 'xo'

const ansiUp = new AnsiUp()

const Support = decorate([
  adminOnly,
  provideState({
    initialState: () => ({ stdoutCheckXoa: '' }),
    effects: {
      initialize: async () => ({ stdoutCheckXoa: await getCheckXoa() }),
      getCheckXoa: async () => ({ stdoutCheckXoa: await getCheckXoa() }),
    },
  }),
  injectState,
  ({ effects, state: { stdoutCheckXoa } }) => (
    <Container>
      <Row>
        <Col mediumSize={6}>
          <Card>
            <CardHeader>{_('xoaCheck')}</CardHeader>
            <CardBlock>
              <ActionButton
                btnStyle='success'
                handler={effects.getCheckXoa}
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
      </Row>
    </Container>
  ),
])

export default Support
