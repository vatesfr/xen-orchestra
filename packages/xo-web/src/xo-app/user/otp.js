import React, { Component } from 'react'
import authenticator from 'otplib/authenticator'
import crypto from 'crypto'
import qrcode from 'qrcode'

import { Container, Row, Col } from '../../common/grid'
import ActionButton from '../../common/action-button'

authenticator.options = { crypto }

class Otp extends Component {
  constructor(props) {
    super(props)
    this.state = {
      secret: authenticator.generateSecret(),
      qrcode: undefined,
    }
  }

  componentDidMount() {
    const { secret } = this.state
    const otpauth = authenticator.keyuri('user', 'service', secret)

    qrcode
      .toDataURL(otpauth)
      .then(url => {
        this.setState({ qrcode: url })
      })
      .catch(err => {
        console.error(err)
      })
  }

  render() {
    const { secret, qrcode } = this.state
    return (
      <Container>
        <Row>
          <Col smallSize={2}>
            <strong>Authentification OTP</strong>
          </Col>
          <Col smallSize={10}>
            <div>Activer</div>
            <input checked type='checkbox' />
            <div>{secret}</div>
            <img src={qrcode} alt='qrcode' />
            <ActionButton
              icon='save'
              btnStyle='primary'
              handler={() => console.log('otp', '68')}
            >
              SAVE
            </ActionButton>
          </Col>
        </Row>
      </Container>
    )
  }
}

export default Otp
