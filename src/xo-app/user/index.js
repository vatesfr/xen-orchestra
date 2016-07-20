import _, { messages } from 'intl'
import ActionButton from 'action-button'
import BaseComponent from 'base-component'
import Icon from 'icon'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import React from 'react'
import { alert } from 'modal'
import { connectStore } from 'utils'
import { Container, Row, Col } from 'grid'
import { getLang } from 'selectors'
import { injectIntl } from 'react-intl'
import {
  Card,
  CardBlock,
  CardHeader
} from 'card'
import {
  addSshKey,
  changePassword,
  deleteSshKey,
  subscribeCurrentUser
} from 'xo'

import Page from '../page'

const HEADER = <Container>
  <Row>
    <Col>
      <h2><Icon icon='user' /> {_('userPage')}</h2>
    </Col>
  </Row>
</Container>

@connectStore({
  lang: getLang
})
@injectIntl
export default class User extends BaseComponent {
  handleSelectLang = event => {
    this.props.selectLang(event.target.value)
  }

  componentWillMount () {
    this.componentWillUnmount = subscribeCurrentUser(user => this.setState({ user }))
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

  _addSshKey = () => addSshKey(this.state.user)
  _deleteSshKey = key => deleteSshKey(this.state.user, key)

  render () {
    const { formatMessage } = this.props.intl
    const {
      lang
    } = this.props
    const {
      confirmPassword,
      newPassword,
      oldPassword,
      user
    } = this.state

    const sshKeys = user && user.preferences && user.preferences.sshKeys

    return <Page header={HEADER} title={user && user.email}>
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
              <option value='es'>Español</option>
            </select>
          </Col>
        </Row>
      </Container>
      <br />
      <div>
        <Card>
          <CardHeader>
            <Icon icon='ssh-key' /> {_('sshKeys')}
            <ActionButton
              className='btn-success pull-xs-right'
              icon='add'
              handler={this._addSshKey}
            >
              {_('newSshKey')}
            </ActionButton>
          </CardHeader>
          <CardBlock>
            {!isEmpty(sshKeys)
              ? <Container>
                {map(sshKeys, (sshKey, key) => (
                  <Row key={key} className='p-b-1'>
                    <Col size={2}>
                      <strong>{sshKey.title}</strong>
                    </Col>
                    <Col size={8} style={{overflowWrap: 'break-word'}}>
                      {sshKey.key}
                    </Col>
                    <Col size={2}>
                      <ActionButton
                        className='btn-secondary pull-xs-right'
                        icon='delete'
                        handler={() => this._deleteSshKey(sshKey)}
                      >
                        {_('deleteSshKey')}
                      </ActionButton>
                    </Col>
                  </Row>
                ))}
              </Container>
              : _('noSshKeys')
            }
          </CardBlock>
        </Card>
      </div>
    </Page>
  }
}
