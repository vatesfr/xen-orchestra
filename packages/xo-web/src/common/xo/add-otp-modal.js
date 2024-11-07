import _ from '../intl'
import authenticator from '../otp-authenticator.js'
import Copiable from '../copiable/index.js'
import qrcode from 'qrcode'
import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { Col, Row } from '../grid.js'

const RE = /\s+/g

export class AddOtpModal extends PureComponent {
  static propTypes = {
    failedToken: PropTypes.string,
    secret: PropTypes.string.isRequired,
    user: PropTypes.object.isRequired,
  }

  state = {}
  constructor(props, context) {
    super(props, context)

    qrcode.toDataURL(authenticator.keyuri(props.user.email, 'Xen Orchestra', props.secret), (err, url) => {
      if (err) {
        return console.warn('error while generating QR code', err)
      }
      this.state.qrcode = url
    })
  }

  value = ''
  _saveValue = event => {
    this.value = event.target.value.replace(RE, '')
  }

  render() {
    const { qrcode } = this.state
    return (
      <div>
        <p>{_('addOtpConfirmMessage')}</p>
        <Row>
          <Col size={4}>
            <strong>{_('password')}</strong>
          </Col>
          <Col size={8}>
            <input className='form-control' inputMode='numeric' onChange={this._saveValue} />
            {this.value === this.props.failedToken && <p className='text-warning'>{_('addOtpInvalidPassword')}</p>}
          </Col>
        </Row>
        <hr />
        {qrcode !== undefined && (
          <div className='text-xs-center'>
            <img src={qrcode} alt='qrcode' />
          </div>
        )}
        <Copiable tagName='div' className='text-xs-center'>
          {this.props.secret}
        </Copiable>
      </div>
    )
  }
}
