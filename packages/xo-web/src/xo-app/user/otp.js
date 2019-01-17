import authenticator from 'otplib/authenticator'
import Component from 'base-component'
import crypto from 'crypto'
import qrcode from 'qrcode'
import React from 'react'
import { addOtp, removeOtp } from 'xo'

import { Container, Row, Col } from '../../common/grid'
import { Toggle } from '../../common/form'

authenticator.options = { crypto }

export default class Otp extends Component {
  constructor(props) {
    super(props)

    this.state = {
      secret: props.user.preferences.otp || authenticator.generateSecret(),
      qrcode: undefined,
    }
  }

  componentDidMount() {
    const { secret } = this.state
    const { user } = this.props
    const otpauth = authenticator.keyuri(user.email, 'XenOrchestra', secret)

    qrcode.toDataURL(otpauth).then(url => {
      this.setState({ qrcode: url })
    })
  }

  _handleOtp = isChecked => {
    const { secret } = this.state

    if (isChecked) {
      addOtp(secret)
    } else {
      removeOtp()
    }
  }

  render() {
    const { secret, qrcode } = this.state
    const { user } = this.props

    return (
      <Container>
        <Row>
          <Col smallSize={2}>
            <strong>Authentification OTP</strong>
          </Col>
          <Col smallSize={10}>
            <Toggle
              value={user.preferences.otp || false}
              onChange={value => this._handleOtp(value)}
            />
            {user.preferences.otp !== undefined && (
              <div>
                <div>{secret}</div>
                <img src={qrcode} alt='qrcode' />
              </div>
            )}
          </Col>
        </Row>
      </Container>
    )
  }
}
