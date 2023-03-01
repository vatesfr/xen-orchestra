import * as FormGrid from 'form-grid'
import _, { messages } from 'intl'
import ActionButton from 'action-button'
import Component from 'base-component'
import Copiable from 'copiable'
import homeFilters from 'home-filters'
import Icon from 'icon'
import PropTypes from 'prop-types'
import React from 'react'
import SortedTable from 'sorted-table'
import Tooltip from 'tooltip'
import { Text } from 'editable'
import { alert } from 'modal'
import { Container, Row, Col } from 'grid'
import { getLang } from 'selectors'
import { isEmpty, map } from 'lodash'
import { injectIntl } from 'react-intl'
import { Select } from 'form'
import { Card, CardBlock, CardHeader } from 'card'
import { addSubscriptions, connectStore, noop, NumericDate } from 'utils'
import {
  addAuthToken,
  addSshKey,
  changePassword,
  deleteAuthToken,
  deleteAuthTokens,
  deleteSshKey,
  deleteSshKeys,
  editAuthToken,
  editCustomFilter,
  removeCustomFilter,
  setDefaultHomeFilter,
  signOutFromEverywhereElse,
  subscribeUserAuthTokens,
  subscribeCurrentUser,
} from 'xo'

import Page from '../page'
import Otp from './otp'

// ===================================================================

const HEADER = (
  <Container>
    <Row>
      <Col>
        <h2>
          <Icon icon='user' /> {_('userPage')}
        </h2>
      </Col>
    </Row>
  </Container>
)

// ===================================================================

const FILTER_TYPE_TO_LABEL_ID = {
  host: 'homeTypeHost',
  pool: 'homeTypePool',
  VM: 'homeTypeVm',
  'VM-template': 'homeTypeVmTemplate',
  SR: 'homeTypeSr',
}

const SSH_KEY_STYLE = { wordWrap: 'anywhere' }

const getDefaultFilter = (defaultFilters, type) => {
  if (defaultFilters == null) {
    return ''
  }

  return defaultFilters[type] || ''
}

const getUserPreferences = user => user.preferences || {}

// ===================================================================

class DefaultFilterPicker extends Component {
  static propTypes = {
    customFilters: PropTypes.object,
    defaultFilter: PropTypes.string.isRequired,
    filters: PropTypes.object.isRequired,
    type: PropTypes.string.isRequired,
  }

  _computeOptions(props) {
    const { customFilters, filters } = props

    // Custom filters.
    const options = [
      {
        label: _('customFilters'),
        disabled: true,
      },
    ]

    options.push.apply(
      options,
      map(customFilters, (filter, name) => ({
        label: name,
        value: name,
      }))
    )

    // Default filters
    options.push({
      label: _('defaultFilters'),
      disabled: true,
    })

    options.push.apply(
      options,
      map(filters, (filter, labelId) => ({
        label: _(labelId),
        value: labelId,
      }))
    )

    this.setState({ options })
  }

  _handleDefaultFilter = value => setDefaultHomeFilter(this.props.type, value && value.value).catch(noop)

  componentWillMount() {
    this._computeOptions(this.props)
  }

  componentWillReceiveProps(props) {
    this._computeOptions(props)
  }

  render() {
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

class UserFilters extends Component {
  static propTypes = {
    user: PropTypes.object.isRequired,
  }

  _removeFilter = ({ name, type }) => removeCustomFilter(type, name)

  render() {
    const { defaultHomeFilters, filters: customFiltersByType } = getUserPreferences(this.props.user)

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
                            <Text onChange={newName => editCustomFilter(type, name, { newName })} value={name} />
                          </div>
                        </Col>
                        <Col mediumSize={7}>
                          <div className='input-group'>
                            <Text onChange={newValue => editCustomFilter(type, name, { newValue })} value={filter} />
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
const COLUMNS = [
  {
    default: true,
    itemRenderer: sshKey => sshKey.title,
    name: _('title'),
    sortCriteria: 'title',
  },
  {
    itemRenderer: sshKey => <span style={SSH_KEY_STYLE}>{sshKey.key}</span>,
    name: _('key'),
  },
]

const INDIVIDUAL_ACTIONS = [
  {
    handler: deleteSshKey,
    icon: 'delete',
    label: _('deleteSshKey'),
    level: 'danger',
  },
]

const GROUPED_ACTIONS = [
  {
    handler: deleteSshKeys,
    icon: 'delete',
    label: _('deleteSshKeys'),
    level: 'danger',
  },
]

const SshKeys = addSubscriptions({
  user: subscribeCurrentUser,
})(({ user }) => {
  const sshKeys = user && user.preferences && user.preferences.sshKeys

  const sshKeysWithIds = map(sshKeys, sshKey => ({
    ...sshKey,
    id: sshKey.key,
  }))

  return (
    <div>
      <Card>
        <CardHeader>
          <Icon icon='ssh-key' /> {_('sshKeys')}
          <ActionButton className='btn-success pull-right' icon='add' handler={addSshKey}>
            {_('newSshKey')}
          </ActionButton>
        </CardHeader>
        <CardBlock>
          <SortedTable
            collection={sshKeysWithIds}
            columns={COLUMNS}
            groupedActions={GROUPED_ACTIONS}
            individualActions={INDIVIDUAL_ACTIONS}
            stateUrlParam='s'
          />
        </CardBlock>
      </Card>
    </div>
  )
})

// ===================================================================
const COLUMNS_AUTH_TOKENS = [
  {
    itemRenderer: ({ id }) => (
      <Copiable tagName='pre' data={id}>
        {id.slice(0, 5)}…
      </Copiable>
    ),
    name: _('authToken'),
  },
  {
    itemRenderer: token => (
      <Text value={token.description ?? ''} onChange={description => editAuthToken({ ...token, description })} />
    ),
    name: _('description'),
    sortCriteria: 'description',
  },
  {
    itemRenderer: ({ created_at }) => {
      if (created_at !== undefined) {
        return <NumericDate timestamp={created_at} />
      }
      return _('notDefined')
    },
    name: _('creation'),
    sortCriteria: 'created_at',
  },
  {
    default: true,
    itemRenderer: ({ expiration }) => <NumericDate timestamp={expiration} />,
    name: _('expiration'),
    sortCriteria: 'expiration',
  },
]

const INDIVIDUAL_ACTIONS_AUTH_TOKENS = [
  {
    handler: deleteAuthToken,
    icon: 'delete',
    label: _('delete'),
    level: 'danger',
  },
]

const GROUPED_ACTIONS_AUTH_TOKENS = [
  {
    handler: deleteAuthTokens,
    icon: 'delete',
    label: _('deleteAuthTokens'),
    level: 'danger',
  },
]

const UserAuthTokens = addSubscriptions({
  userAuthTokens: subscribeUserAuthTokens,
})(({ userAuthTokens }) => (
  <div>
    <Card>
      <CardHeader>
        <Icon icon='user' /> {_('authTokens')}
        <ActionButton className='btn-success pull-right' icon='add' handler={addAuthToken}>
          {_('newAuthToken')}
        </ActionButton>
      </CardHeader>
      <CardBlock>
        <SortedTable
          collection={userAuthTokens}
          columns={COLUMNS_AUTH_TOKENS}
          stateUrlParam='s_auth_tokens'
          groupedActions={GROUPED_ACTIONS_AUTH_TOKENS}
          individualActions={INDIVIDUAL_ACTIONS_AUTH_TOKENS}
        />
      </CardBlock>
    </Card>
  </div>
))

// ===================================================================

@addSubscriptions({
  user: subscribeCurrentUser,
})
@connectStore({
  lang: getLang,
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
    return changePassword(oldPassword, newPassword).then(() =>
      this.setState({
        oldPassword: undefined,
        newPassword: undefined,
        confirmPassword: undefined,
      })
    )
  }

  _handleOldPasswordChange = event => this.setState({ oldPassword: event.target.value })
  _handleNewPasswordChange = event => this.setState({ newPassword: event.target.value })
  _handleConfirmPasswordChange = event => this.setState({ confirmPassword: event.target.value })

  render() {
    const { lang, user } = this.props

    if (!user) {
      return <p>Loading…</p>
    }

    const { formatMessage } = this.props.intl
    const { confirmPassword, newPassword, oldPassword } = this.state

    return (
      <Page header={HEADER} title={user.email}>
        <Container>
          <Row>
            <Col smallSize={2}>
              <strong>{_('username')}</strong>
            </Col>
            <Col smallSize={10}>{user.email}</Col>
          </Row>
          <br />
          {isEmpty(user.authProviders) && (
            <Row className='mb-1'>
              <Col smallSize={2}>
                <strong>{_('password')}</strong>
              </Col>
              <Col smallSize={10}>
                <form className='form-inline' id='changePassword'>
                  <input
                    autoComplete='off'
                    className='form-control'
                    onChange={this._handleOldPasswordChange}
                    placeholder={formatMessage(messages.oldPasswordPlaceholder)}
                    required
                    type='password'
                    value={oldPassword || ''}
                  />{' '}
                  <input
                    type='password'
                    autoComplete='off'
                    className='form-control'
                    onChange={this._handleNewPasswordChange}
                    placeholder={formatMessage(messages.newPasswordPlaceholder)}
                    required
                    value={newPassword}
                  />{' '}
                  <input
                    autoComplete='off'
                    className='form-control'
                    onChange={this._handleConfirmPasswordChange}
                    placeholder={formatMessage(messages.confirmPasswordPlaceholder)}
                    required
                    type='password'
                    value={confirmPassword}
                  />{' '}
                  <ActionButton icon='save' form='changePassword' btnStyle='primary' handler={this._handleSavePassword}>
                    {_('changePasswordOk')}
                  </ActionButton>
                </form>
              </Col>
            </Row>
          )}
          <Row>
            <Col smallSize={10} offset={2}>
              <Tooltip content={_('forgetTokensExplained')}>
                <ActionButton btnStyle='danger' handler={signOutFromEverywhereElse} icon='disconnect'>
                  {_('forgetTokens')}
                </ActionButton>
              </Tooltip>
            </Col>
          </Row>
          <br />
          <Row>
            <Col smallSize={2}>
              <strong>{_('language')}</strong>
            </Col>
            <Col smallSize={10}>
              <select className='form-control' onChange={this.handleSelectLang} value={lang} style={{ width: '10em' }}>
                <option value='en'>English</option>
                <option value='ru'>Русский</option>
                <option value='es'>Español</option>
                <option value='fr'>Français</option>
                <option value='hu'>Magyar</option>
                <option value='it'>Italiano</option>
                <option value='pl'>Polski</option>
                <option value='pt'>Português</option>
                <option value='tr'>Türkçe</option>
                <option value='he'>עברי</option>
                <option value='zh'>简体中文</option>
              </select>
            </Col>
          </Row>
        </Container>
        <hr />
        {(process.env.XOA_PLAN > 2 || user.preferences.otp !== undefined) && [
          <Otp user={user} key='otp' />,
          <hr key='hr' />,
        ]}
        <SshKeys />
        <hr />
        <UserAuthTokens />
        <hr />
        <UserFilters user={user} />
      </Page>
    )
  }
}
