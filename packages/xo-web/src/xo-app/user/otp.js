import _ from 'intl'
import authenticator from 'otplib/authenticator'
import crypto from 'crypto'
import decorate from 'apply-decorators'
import qrcode from 'qrcode'
import React from 'react'
import { addOtp, removeOtp } from 'xo'
import { injectState, provideState } from 'reaclette'

import { Container, Row, Col } from '../../common/grid'
import { Toggle } from '../../common/form'

authenticator.options = { crypto }

export default decorate([
  provideState({
    initialState: ({ user: { preferences = {} } }) => ({
      secret: preferences.otp !== undefined ? preferences.otp : authenticator.generateSecret(),
    }),
    effects: {
      _handleOtp(_, isChecked) {
        return isChecked ? addOtp(this.state.secret) : removeOtp()
      },
    },
    computed: {
      qrcode({ secret }, { user }) {
        return qrcode.toDataURL(authenticator.keyuri(user.email, 'XenOrchestra', secret))
      },
    },
  }),
  injectState,
  ({ state, effects, user }) => (
    <Container>
      <Row>
        <Col smallSize={2}>
          <strong>{_('OtpAuthentication')}</strong>
        </Col>
        <Col smallSize={10}>
          <Toggle value={user.preferences.otp !== undefined} onChange={effects._handleOtp} />{' '}
          {user.preferences.otp !== undefined && (
            <span>
              {state.secret}
              <div>{state.qrcode !== undefined && <img src={state.qrcode} alt='qrcode' />}</div>
            </span>
          )}
        </Col>
      </Row>
    </Container>
  ),
])
