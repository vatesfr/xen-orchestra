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
    initialState: ({ user }) => ({
      secret: user.preferences.otp || authenticator.generateSecret(),
    }),
    effects: {
      _handleOtp: (_, isChecked) => ({ secret }, _) => {
        if (isChecked) {
          addOtp(secret)
        } else {
          removeOtp()
        }
      },
    },
    computed: {
      async qrcode({ secret }, { user }) {
        const otpauth = authenticator.keyuri(user.email, 'XenOrchestra', secret)
        return qrcode.toDataURL(otpauth).then(url => url)
      },
    },
  }),
  injectState,
  ({ state, effects, user }) => (
    <Container>
      <Row>
        <Col smallSize={2}>
          <strong>Authentification OTP</strong>
        </Col>
        <Col smallSize={10}>
          <Toggle
            value={user.preferences.otp || false}
            onChange={effects._handleOtp}
          />
          {user.preferences.otp !== undefined && (
            <div>
              <div>{state.secret}</div>
              {state.qrcode !== undefined && (
                <img src={state.qrcode} alt='qrcode' />
              )}
            </div>
          )}
        </Col>
      </Row>
    </Container>
  ),
])
