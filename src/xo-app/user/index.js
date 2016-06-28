import _, { messages } from 'intl'
import ActionButton from 'action-button'
import Icon from 'icon'
import React, { Component } from 'react'
import { alert } from 'modal'
import { autobind, connectStore } from 'utils'
import { changePassword } from 'xo'
import { Container, Row, Col } from 'grid'
import { getLang, getUser } from 'selectors'
import { injectIntl } from 'react-intl'

import Page from '../page'

const HEADER = <Container>
  <Row>
    <Col mediumSize={12}>
      <h2><Icon icon='user' /> {_('userPage')}</h2>
    </Col>
  </Row>
</Container>

@connectStore({
  lang: getLang,
  user: getUser
})
@injectIntl
export default class User extends Component {
  @autobind
  handleSelectLang (event) {
    this.props.selectLang(event.target.value)
  }
  _handlePasswordChange = () => {
    const { oldPassword, newPassword, confirmPassword } = this.refs
    if (newPassword.value !== confirmPassword.value) {
      return alert(_('confirmationPasswordError'), _('confirmationPasswordErrorBody'))
    }
    return changePassword(oldPassword.value, newPassword.value).then(() => {
      oldPassword.value = ''
      newPassword.value = ''
      confirmPassword.value = ''
    })
  }
  render () {
    const { formatMessage } = this.props.intl
    const {
      lang,
      user
    } = this.props

    return <Page header={HEADER}>
      <table className='table'>
        <tbody>
          <tr>
            <th>{_('username')}</th>
            <td>
              {user && user.email}
            </td>
          </tr>
          <tr>
            <th>{_('password')}</th>
            <td>
              <form className='form-inline' id='changePassword'>
                <input type='password' ref='oldPassword' placeholder={formatMessage(messages.oldPasswordPlaceholder)} className='form-control' required />
                {' '}
                <input type='password' ref='newPassword' placeholder={formatMessage(messages.newPasswordPlaceholder)} className='form-control' required />
                {' '}
                <input type='password' ref='confirmPassword' placeholder={formatMessage(messages.confirmPasswordPlaceholder)} className='form-control' required />
                {' '}
                <ActionButton icon='ok' form='changePassword' btnStyle='success' handler={this._handlePasswordChange}>
                  {_('changePasswordOk')}
                </ActionButton>
              </form>
            </td>
          </tr>
          <tr>
            <th>{_('language')}</th>
            <td>
              <select className='form-control' onChange={this.handleSelectLang} value={lang} style={{width: '10em'}}>
                <option value='en'>English</option>
                <option value='fr'>Français</option>
                <option value='he'>עברי</option>
                <option value='pt'>Português</option>
              </select>
            </td>
          </tr>
        </tbody>
      </table>
    </Page>
  }
}
