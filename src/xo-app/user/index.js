import _, { messages } from 'intl'
import ActionButton from 'action-button'
import BaseComponent from 'base-component'
import Icon from 'icon'
import React from 'react'
import { alert } from 'modal'
import { autobind, connectStore } from 'utils'
import { changePassword } from 'xo'
import { Container, Row, Col } from 'grid'
import { getLang, getUser } from 'selectors'
import { injectIntl } from 'react-intl'

import Page from '../page'

const HEADER = <Container>
  <Row>
    <Col>
      <h2><Icon icon='user' /> {_('userPage')}</h2>
    </Col>
  </Row>
</Container>

@connectStore({
  lang: getLang,
  user: getUser
})
@injectIntl
export default class User extends BaseComponent {
  @autobind
  handleSelectLang (event) {
    this.props.selectLang(event.target.value)
  }
  _handleSavePassword = () => {
    const { oldPassword, newPassword, confirmPassword } = this.state
    if (newPassword !== confirmPassword) {
      return alert(_('confirmationPasswordError'), _('confirmationPasswordErrorBody'))
    }
    return changePassword(oldPassword, newPassword).then(() => this.setState({
      oldPassword: undefined,
      newPassword: undefined,
      confirmPassword: undefined
    }))
  }

  _handleOldPasswordChange = event => this.setState({ oldPassword: event.target.value })
  _handleNewPasswordChange = event => this.setState({ newPassword: event.target.value })
  _handleConfirmPasswordChange = event => this.setState({ confirmPassword: event.target.value })

  render () {
    const { formatMessage } = this.props.intl
    const {
      lang,
      user
    } = this.props
    const {
      confirmPassword,
      newPassword,
      oldPassword
    } = this.state

    return <Page header={HEADER}>
      <Container>
        <Row>
          <Col smallSize={2}><strong>{_('username')}</strong></Col>
          <Col smallSize={10}>
            {user && user.email}
          </Col>
        </Row>
        <br />
        <Row>
          <Col smallSize={2}><strong>{_('password')}</strong></Col>
          <Col smallSize={10}>
            <form className='form-inline' id='changePassword'>
              <input type='password' onChange={this._handleOldPasswordChange} value={oldPassword} placeholder={formatMessage(messages.oldPasswordPlaceholder)} className='form-control' required />
              {' '}
              <input type='password' onChange={this._handleNewPasswordChange} value={newPassword} placeholder={formatMessage(messages.newPasswordPlaceholder)} className='form-control' required />
              {' '}
              <input type='password' onChange={this._handleConfirmPasswordChange} value={confirmPassword} placeholder={formatMessage(messages.confirmPasswordPlaceholder)} className='form-control' required />
              {' '}
              <ActionButton icon='save' form='changePassword' btnStyle='primary' handler={this._handleSavePassword}>
                {_('changePasswordOk')}
              </ActionButton>
            </form>
          </Col>
        </Row>
        <br />
        <Row>
          <Col smallSize={2}><strong>{_('language')}</strong></Col>
          <Col smallSize={10}>
            <select className='form-control' onChange={this.handleSelectLang} value={lang} style={{width: '10em'}}>
              <option value='en'>English</option>
              <option value='fr'>Français</option>
              <option value='he'>עברי</option>
              <option value='pt'>Português</option>
            </select>
          </Col>
        </Row>
      </Container>
    </Page>
  }
}
