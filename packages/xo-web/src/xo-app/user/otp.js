import _ from 'intl'
import decorate from 'apply-decorators'
import qrcode from 'qrcode'
import React from 'react'
import { addOtp, removeOtp } from 'xo'
import { injectState, provideState } from 'reaclette'

import authenticator from '../../common/otp-authenticator.js'
import { Container, Row, Col } from '../../common/grid'
import { Toggle } from '../../common/form'

export default decorate([
  provideState({
    effects: {
      _handleOtp(_, isChecked) {
        return isChecked ? addOtp(authenticator.generateSecret()) : removeOtp()
      },
    },
    computed: {
      qrcode: /* async */ ({ secret }, props) =>
        secret && qrcode.toDataURL(authenticator.keyuri(props.user.email, 'XenOrchestra', secret)),
      secret: (_, { user }) => user?.preferences?.otp,
    },
  }),
  injectState,
  ({ state: { qrcode, secret }, effects, user }) => (
    <Container>
      <Row>
        <Col smallSize={2}>
          <strong>{_('OtpAuthentication')}</strong>
        </Col>
        <Col smallSize={10}>
          <Row>
            <Toggle className='align-middle' value={user.preferences.otp !== undefined} onChange={effects._handleOtp} />
            {secret !== undefined && ' ' + secret}
          </Row>
          {qrcode !== undefined && (
            <Row>
              <img src={qrcode} alt='qrcode' />
            </Row>
          )}
        </Col>
      </Row>
    </Container>
  ),
])
