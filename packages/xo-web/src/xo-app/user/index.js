import * as FormGrid from 'form-grid'
import _, { messages } from 'intl'
import ActionButton from 'action-button'
import Component from 'base-component'
import Copiable from 'copiable'
import homeFilters from 'home-filters'
import Icon from 'icon'
import PropTypes from 'prop-types'
import React from 'react'
import SelectFiles from 'select-files'
import SortedTable from 'sorted-table'
import Tooltip from 'tooltip'
import { Text } from 'editable'
import { alert, confirm } from 'modal'
import { Container, Row, Col } from 'grid'
import { error, success } from 'notification'
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
  editXsCredentials,
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

@addSubscriptions({
  user: subscribeCurrentUser,
})
class XsClientId extends Component {
  async editXsCredentials(file) {
    if (file === undefined) {
      error(_('noFileSelected'))
      return
    }

    try {
      await new Promise((resolve, reject) => {
        const fr = new window.FileReader()
        fr.onload = event => {
          try {
            const { username, apikey } = JSON.parse(event.target.result)
            if (username === undefined || apikey === undefined) {
              reject(new Error('Could not find username and apikey in file'))
            }

            editXsCredentials({ username, apikey }).then(resolve, reject)
          } catch (err) {
            reject(err)
          }
        }
        fr.readAsText(file)
      })
      success(_('setXsCredentialsSuccess'))
    } catch (err) {
      error(_('setXsCredentialsError'), err.message)
    }
  }

  async deleteXsCredentials() {
    await confirm({
      icon: 'delete',
      title: _('forgetClientId'),
      body: _('forgetXsCredentialsConfirm'),
    })
    try {
      await editXsCredentials(null)
      success(_('forgetXsCredentialsSuccess'))
    } catch (err) {
      error('forgetXsCredentialsError', err.message)
    }
  }

  render() {
    const isConfigured = this.props.user?.preferences?.xsCredentials !== undefined
    return (
      <Container>
        <Row>
          <Col smallSize={2}>
            <strong>{_('xsClientId')}</strong>{' '}
            <a href='https://xen-orchestra.com/docs/updater.html#xenserver-updates' target='_blank' rel='noreferrer'>
              <Icon icon='info' />
            </a>
          </Col>
          <Col smallSize={10}>
            <span className='mr-1'>{isConfigured ? _('configured') : _('notConfigured')}</span>
            <SelectFiles onChange={this.editXsCredentials} label={_('uploadClientId')} />{' '}
            {isConfigured && (
              <ActionButton btnStyle='danger' handler={this.deleteXsCredentials} icon='delete'>
                {_('forgetClientId')}
              </ActionButton>
            )}
          </Col>
        </Row>
      </Container>
    )
  }
}

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
    itemRenderer: ({ last_use_ip, last_uses }) => {
      if (last_use_ip !== undefined) {
        return (
          <span>
            <NumericDate timestamp={last_uses[last_use_ip].timestamp} /> by <code>{last_use_ip}</code>
          </span>
        )
      }
      return _('notDefined')
    },
    name: _('authTokenLastUse'),
    sortCriteria: ({ last_use_ip, last_uses }) => last_use_ip && last_uses[last_use_ip].timestamp,
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
  userAuthTokens: cb =>
    subscribeUserAuthTokens(tokens => {
      cb(
        tokens.map(token => {
          // find and inject last_use_ip from last_uses dictionnary
          const { last_uses } = token
          if (last_uses !== undefined) {
            const ips = Object.keys(last_uses)
            const n = ips.length
            if (n !== 0) {
              let lastIp = ips[0]
              let lastTimestamp = last_uses[lastIp].timestamp
              for (let i = 1; i < n; ++i) {
                const ip = ips[i]
                const { timestamp } = last_uses[ip]
                if (timestamp > lastTimestamp) {
                  lastIp = ip
                  lastTimestamp = timestamp
                }
              }
              return { ...token, last_use_ip: lastIp }
            }
          }

          return token
        })
      )
    }),
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
                <option value='fa'>Persian</option>
                <option value='fr'>Français</option>
                <option value='hu'>Magyar</option>
                <option value='it'>Italiano</option>
                <option value='pl'>Polski</option>
                <option value='pt'>Português</option>
                <option value='se'>Svenska</option>
                <option value='tr'>Türkçe</option>
                <option value='he'>עברי</option>
                <option value='zh'>简体中文</option>
                <option value='ja'>日本語</option>
              </select>
            </Col>
          </Row>
        </Container>
        <hr />
        {(process.env.XOA_PLAN > 2 || user.preferences.otp !== undefined) && [
          <Otp user={user} key='otp' />,
          <hr key='hr' />,
        ]}
        <XsClientId user={user} />
        <hr />
        <SshKeys />
        <hr />
        <UserAuthTokens />
        <hr />
        <UserFilters user={user} />
      </Page>
    )
  }
}
