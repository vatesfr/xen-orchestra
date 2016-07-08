import * as FormGrid from 'form-grid'
import * as homeFilters from 'home-filters'
import _, { messages } from 'intl'
import ActionButton from 'action-button'
import Component from 'base-component'
import forEach from 'lodash/forEach'
import Icon from 'icon'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import propTypes from 'prop-types'
import React from 'react'
import size from 'lodash/size'
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
  removeUserFilter,
  setDefaultUserFilter,
  setUserFilters,
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
  VM: 'homeTypeVm',
  host: 'homeTypeHost',
  pool: 'homeTypePool'
}

const getDefaultFilter = (defaultFilters, type) => {
  if (defaultFilters == null) {
    return ''
  }

  const defaultFilter = defaultFilters[type]
  return defaultFilter ? `${defaultFilter.isCustom ? 'C' : 'D'}${defaultFilter.name}` : ''
}

const getUserPreferences = user => user.preferences || {}

// ===================================================================

@propTypes({
  customFilters: propTypes.object.isRequired,
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
      value: `C${name}`
    })))

    // Default filters
    options.push({
      label: _('defaultFilters'),
      disabled: true
    })

    options.push.apply(options, map(filters, (filter, labelId) => ({
      label: _(labelId),
      value: `D${labelId}`
    })))

    this.setState({ options })
  }

  _handleDefaultFilter = value => {
    const { type } = this.props

    if (value == null) {
      return setDefaultUserFilter({ type }).catch(noop)
    }

    value = value.value

    return setDefaultUserFilter({
      isCustom: value.charAt(0) === 'C',
      name: value.slice(1),
      type
    }).catch(noop)
  }

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
  _saveFilters = () => {
    const newFilters = {}
    const { refs } = this

    forEach(getUserPreferences(this.props.user).filters, (filters, type) => {
      const _filters = newFilters[type] = {}
      forEach(filters, (_, name) => {
        _filters[refs[`filter-${name}`].value] = refs[`value-${name}`].value
      })
    })

    return setUserFilters(newFilters)
  }

  _removeFilter = filter => removeUserFilter(filter)

  render () {
    const {
      defaultFilters,
      filters: customFiltersByType
    } = getUserPreferences(this.props.user)
    let nCustomFilters = 0

    return (
      <Container>
        <Row>
          <Col>
            <h4>{_('customizeFilters')}</h4>
            <form id='filters-form'>
              {map(homeFilters, (filters, type) => {
                const customFilters = customFiltersByType[type]
                const defaultFilter = getDefaultFilter(defaultFilters, type)

                nCustomFilters += size(customFilters)

                return (
                  <div key={type}>
                    <h5>{_(FILTER_TYPE_TO_LABEL_ID[type])}</h5>
                    <hr />
                    <DefaultFilterPicker
                      customFilters={customFilters}
                      defaultFilter={defaultFilter}
                      filters={filters}
                      type={type}
                    />
                    {map(customFilters, (filter, name) => (
                      <Row key={name} className='p-b-1'>
                        <Col mediumSize={4}>
                          <div className='input-group'>
                            <input
                              className='form-control'
                              defaultValue={name}
                              ref={`filter-${name}`}
                              required
                              type='text'
                            />
                          </div>
                        </Col>
                        <Col mediumSize={7}>
                          <div className='input-group'>
                            <input
                              className='form-control'
                              defaultValue={filter}
                              ref={`value-${name}`}
                              required
                              type='text'
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
            </form>
            {nCustomFilters > 0 &&
              <ActionButton
                btnStyle='primary'
                className='pull-right'
                form='filters-form'
                handler={this._saveFilters}
                icon='save'
              >
                {_('saveCustomFilters')}
              </ActionButton>
            }
          </Col>
        </Row>
      </Container>
    )
  }
}

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

    const sshKeys = user && user.preferences && user.preferences.sshKeys

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
              <input type='password' onChange={this._handleOldPasswordChange} value={oldPassword || ''} placeholder={formatMessage(messages.oldPasswordPlaceholder)} className='form-control' required />
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
              handler={addSshKey}
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
      <hr />
      <UserFilters user={user} />
    </Page>
  }
}
