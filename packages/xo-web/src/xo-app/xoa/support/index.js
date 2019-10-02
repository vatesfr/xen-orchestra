import _ from 'intl'
import ActionButton from 'action-button'
import decorate from 'apply-decorators'
import React from 'react'
import { adminOnly } from 'utils'
import { Card, CardBlock, CardHeader } from 'card'
import { Container, Row, Col } from 'grid'
import { injectState, provideState } from 'reaclette'
import { getXoaCheck } from 'xo'

const Support = decorate([
  adminOnly,
  provideState({
    initialState: () => ({ stdoutXoaCheck: [], stderrXoaCheck: [] }),
    effects: {
      async getXoaCheck() {
        const result = await getXoaCheck()
        const { stdout, stderr } = result
        return {
          stdoutXoaCheck:
            stdout !== undefined ? stdout.split('\n') : result.split('\n'),
          stderrXoaCheck: stderr !== undefined ? stderr.split('\n') : [],
        }
      },
    },
  }),
  injectState,
  ({ effects, state: { stderrXoaCheck, stdoutXoaCheck } }) => (
    <Container>
      <Row>
        <Col mediumSize={6}>
          <Card>
            <CardHeader>{_('checkXoa')}</CardHeader>
            <CardBlock>
              <ActionButton
                handler={effects.getXoaCheck}
                btnStyle='success'
                icon=''
              >
                {' '}
                {_('checkXoa')}
              </ActionButton>
              <hr />
              <span className='text-danger'>
                {stderrXoaCheck.map((err, key) => (
                  <div key={key}>
                    <span>{err}</span>
                  </div>
                ))}
              </span>
              <span className='text-success'>
                {stdoutXoaCheck.map((res, key) => (
                  <div key={key}>
                    <span>{res}</span>
                  </div>
                ))}
              </span>
            </CardBlock>
          </Card>
        </Col>
      </Row>
    </Container>
  ),
])

export default Support
