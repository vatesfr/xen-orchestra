import * as FormGrid from 'form-grid'
import * as homeFilters from 'home-filters'
import _, { messages } from 'intl'
import ActionButton from 'action-button'
import Component from 'base-component'
import Icon from 'icon'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import propTypes from 'prop-types'
import React from 'react'
import { Text } from 'editable'
import { alert } from 'modal'
import { Container, Row, Col } from 'grid'
import { getLang } from 'selectors'
import { injectIntl } from 'react-intl'
import { Select } from 'form'
import {
  Card,
  CardBlock,
  CardHeader
} from 'card'
import {
  addSubscriptions,
  connectStore,
  noop
} from 'utils'
import {
  addSshKey,
  changePassword,
  deleteSshKey,
  editCustomFilter,
  removeCustomFilter,
  setDefaultHomeFilter,
  subscribeCurrentUser
} from 'xo'

import Page from '../page'

// ===================================================================

const HEADER = <Container>
  <Row>
    <Col>
      <h2><Icon icon='user' /> {_('userPage')}</h2>
    </Col>
  </Row>
</Container>

// ===================================================================

const FILTER_TYPE_TO_LABEL_ID = {
  host: 'homeTypeHost',
  pool: 'homeTypePool',
  VM: 'homeTypeVm',
  vmTemplate: 'homeTypeVmTemplate'
}

const SSH_KEY_STYLE = { wordWrap: 'break-word' }

const getDefaultFilter = (defaultFilters, type) => {
  if (defaultFilters == null) {
    return ''
  }

  return defaultFilters[type] || ''
}

const getUserPreferences = user => user.preferences || {}

// ===================================================================

@propTypes({
  customFilters: propTypes.object,
  defaultFilter: propTypes.string.isRequired,
  filters: propTypes.object.isRequired,
  type: propTypes.string.isRequired
})
class DefaultFilterPicker extends Component {
  _computeOptions (props) {
    const {
      customFilters,
      filters
    } = props

    // Custom filters.
    const options = [{
      label: _('customFilters'),
      disabled: true
    }]

    options.push.apply(options, map(customFilters, (filter, name) => ({
      label: name,
      value: name
    })))

    // Default filters
    options.push({
      label: _('defaultFilters'),
      disabled: true
    })

    options.push.apply(options, map(filters, (filter, labelId) => ({
      label: _(labelId),
      value: labelId
    })))

    this.setState({ options })
  }

  _handleDefaultFilter = value => (
    setDefaultHomeFilter(
      this.props.type,
      value && value.value
    ).catch(noop)
  )

  componentWillMount () {
    this._computeOptions(this.props)
  }

  componentWillReceiveProps (props) {
    this._computeOptions(props)
  }

  render () {
    return (
      <Row>
        <Col>
          <FormGrid.Row>
            <FormGrid.LabelCol>
              <strong>{_('defaultFilter')}</strong>
            </FormGrid.LabelCol>
            <FormGrid.InputCol>
              <Select
                onChange={this._handleDefaultFilter}
                options={this.state.options}
                value={this.props.defaultFilter}
              />
            </FormGrid.InputCol>
          </FormGrid.Row>
        </Col>
      </Row>
    )
  }
}

// ===================================================================

@propTypes({
  user: propTypes.object.isRequired
})
class UserFilters extends Component {
  _removeFilter = ({ name, type }) => removeCustomFilter(type, name)

  render () {
    const {
      defaultHomeFilters,
      filters: customFiltersByType
    } = getUserPreferences(this.props.user)

    return (
      <Container>
        <Row>
          <Col>
            <h4>{_('customizeFilters')}</h4>
            <div>
              {map(homeFilters, (filters, type) => {
                const labelId = FILTER_TYPE_TO_LABEL_ID[type]
                if (!labelId) {
                  return
                }

                const customFilters = customFiltersByType && customFiltersByType[type]
                const defaultFilter = getDefaultFilter(defaultHomeFilters, type)

                return (
                  <div key={type}>
                    <h5>{_(labelId)}</h5>
                    <hr />
                    <DefaultFilterPicker
                      customFilters={customFilters}
                      defaultFilter={defaultFilter}
                      filters={filters}
                      type={type}
                    />
                    {map(customFilters, (filter, name) => (
                      <Row key={name} className='pb-1'>
                        <Col mediumSize={4}>
                          <div className='input-group'>
                            <Text
                              onChange={newName => editCustomFilter(type, name, { newName })}
                              value={name}
                            />
                          </div>
                        </Col>
                        <Col mediumSize={7}>
                          <div className='input-group'>
                            <Text
                              onChange={newValue => editCustomFilter(type, name, { newValue })}
                              value={filter}
                            />
                          </div>
                        </Col>
                        <Col mediumSize={1}>
                          <ActionButton
                            btnStyle='danger'
                            className='pull-right'
                            handler={this._removeFilter}
                            handlerParam={{ name, type }}
                            icon='delete'
                          />
                        </Col>
                      </Row>
                    ))}
                  </div>
                )
              })}
            </div>
          </Col>
        </Row>
      </Container>
    )
  }
}

// ===================================================================

const SshKeys = addSubscriptions({
  user: subscribeCurrentUser
})(({ user }) => {
  const sshKeys = user && user.preferences && user.preferences.sshKeys

  return <div>
    <Card>
      <CardHeader>
        <Icon icon='ssh-key' /> {_('sshKeys')}
        <ActionButton
          className='btn-success pull-right'
          icon='add'
          handler={addSshKey}
        >
          {_('newSshKey')}
        </ActionButton>
      </CardHeader>
      <CardBlock>
        {!isEmpty(sshKeys)
          ? <Container>
            {map(sshKeys, (sshKey, key) => (
              <Row key={key} className='pb-1'>
                <Col size={2}>
                  <strong>{sshKey.title}</strong>
                </Col>
                <Col size={8} style={SSH_KEY_STYLE}>
                  {sshKey.key}
                </Col>
                <Col size={2}>
                  <ActionButton
                    className='btn-secondary pull-right'
                    icon='delete'
                    handler={() => deleteSshKey(sshKey)}
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
})

// ===================================================================

@addSubscriptions({
  user: subscribeCurrentUser
})
@connectStore({
  lang: getLang
})
@injectIntl
export default class User extends Component {
  handleSelectLang = event => {
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
    const { lang, user } = this.props

    if (!user) {
      return <p>Loading…</p>
    }

    const { formatMessage } = this.props.intl
    const {
      confirmPassword,
      newPassword,
      oldPassword
    } = this.state

    return <Page header={HEADER} title={user.email}>
      <Container>
        <Row>
          <Col smallSize={2}><strong>{_('username')}</strong></Col>
          <Col smallSize={10}>
            {user.email}
          </Col>
        </Row>
        <br />
        <Row>
          <Col smallSize={2}><strong>{_('password')}</strong></Col>
          <Col smallSize={10}>
            <form className='form-inline' id='changePassword'>
              <input
                autocomplete='off'
                className='form-control'
                onChange={this._handleOldPasswordChange}
                placeholder={formatMessage(messages.oldPasswordPlaceholder)}
                required
                type='password'
                value={oldPassword || ''}
              />
              {' '}
              <input type='password'
                autocomplete='off'
                className='form-control'
                onChange={this._handleNewPasswordChange}
                placeholder={formatMessage(messages.newPasswordPlaceholder)}
                required
                value={newPassword}
              />
              {' '}
              <input
                autocomplete='off'
                className='form-control'
                onChange={this._handleConfirmPasswordChange}
                placeholder={formatMessage(messages.confirmPasswordPlaceholder)}
                required
                type='password'
                value={confirmPassword}
              />
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
              <option value='pl'>Polski</option>
              <option value='pt'>Português</option>
              <option value='es'>Español</option>
              <option value='zh'>简体中文</option>
              <option value='hu'>Magyar</option>
            </select>
          </Col>
        </Row>
      </Container>
      <hr />
      <SshKeys />
      <hr />
      <UserFilters user={user} />
    </Page>
  }
}
