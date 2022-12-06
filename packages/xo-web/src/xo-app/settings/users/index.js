import * as Editable from 'editable'
import _, { messages } from 'intl'
import ActionButton from 'action-button'
import Button from 'button'
import Component from 'base-component'
import Icon from 'icon'
import isEmpty from 'lodash/isEmpty'
import keyBy from 'lodash/keyBy'
import map from 'lodash/map'
import React from 'react'
import renderXoItem from 'render-xo-item'
import SortedTable from 'sorted-table'
import Tooltip from 'tooltip'
import { addSubscriptions } from 'utils'
import { get } from '@xen-orchestra/defined'
import { injectIntl } from 'react-intl'
import { Password, Select } from 'form'

import { createUser, deleteUser, deleteUsers, editUser, removeOtp, subscribeGroups, subscribeUsers } from 'xo'

const permissions = {
  none: {
    label: _('userLabel'),
    value: 'none',
  },
  admin: {
    label: _('adminLabel'),
    value: 'admin',
  },
}

const USER_COLUMNS = [
  {
    name: _('userNameColumn'),
    itemRenderer: user =>
      isEmpty(user.authProviders) ? (
        <Editable.Text onChange={email => editUser(user, { email })} value={user.email} />
      ) : (
        user.email
      ),
    sortCriteria: user => user.email,
  },
  {
    name: _('userGroupsColumn'),
    itemRenderer: (user, { groups }) => {
      const nGroups = user.groups.length
      const nGroupsLabel = _('userCountGroups', { nGroups })
      return nGroups !== 0 ? (
        <Tooltip
          content={
            <div>
              {user.groups.map(id => (
                <div key={id}>{get(() => renderXoItem(groups[id]))}</div>
              ))}
            </div>
          }
        >
          {nGroupsLabel}
        </Tooltip>
      ) : (
        nGroupsLabel
      )
    },
  },
  {
    name: _('userPermissionColumn'),
    itemRenderer: user => (
      <Select
        clearable={false}
        value={user.permission || permissions.none.value}
        ref='permission'
        onChange={permission => editUser(user, { permission: permission.value })}
        options={map(permissions)}
      />
    ),
    sortCriteria: user => user.permission,
  },
  {
    name: _('userPasswordColumn'),
    itemRenderer: user =>
      isEmpty(user.authProviders) && <Editable.Password onChange={password => editUser(user, { password })} value='' />,
  },
  {
    name: 'OTP',
    itemRenderer: user =>
      user.preferences.otp !== undefined ? (
        <Button btnStyle='danger' onClick={() => removeOtp(user)} size='small'>
          <Icon icon='remove' /> {_('remove')}
        </Button>
      ) : (
        _('notConfigured')
      ),
  },
]

const USER_ACTIONS = [
  {
    handler: deleteUsers,
    icon: 'delete',
    individualHandler: deleteUser,
    individualLabel: _('deleteUser'),
    label: _('deleteSelectedUsers'),
    level: 'danger',
  },
]

@addSubscriptions({
  groups: cb => subscribeGroups(groups => cb(keyBy(groups, 'id'))),
  users: cb => subscribeUsers(users => cb(keyBy(users, 'id'))),
})
@injectIntl
export default class Users extends Component {
  state = {
    email: '',
    password: '',
    permission: permissions.none,
  }

  _create = () => {
    const { email, password, permission } = this.state
    return createUser(email, password, permission.value).then(() => {
      this.setState({ email: '', password: '', permission: permissions.none })
    })
  }

  render() {
    const { groups, users, intl } = this.props
    const { email, password, permission } = this.state

    return (
      <div>
        <form id='newUserForm' className='form-inline'>
          <div className='form-group'>
            <input
              className='form-control'
              onChange={this.linkState('email')}
              placeholder={intl.formatMessage(messages.userName)}
              required
              type='text'
              value={email}
            />
          </div>{' '}
          <div className='form-group'>
            <Select
              clearable={false}
              onChange={this.linkState('permission')}
              options={map(permissions)}
              placeholder={intl.formatMessage(messages.selectPermission)}
              required
              value={permission}
            />
          </div>{' '}
          <div className='form-group'>
            <Password
              disabled={!this.state.email}
              enableGenerator
              onChange={this.linkState('password')}
              placeholder={intl.formatMessage(messages.userPassword)}
              required
              value={password}
            />
          </div>{' '}
          <ActionButton form='newUserForm' icon='add' btnStyle='success' handler={this._create}>
            {_('createUserButton')}
          </ActionButton>
        </form>
        <hr />
        {isEmpty(users) ? (
          <p>
            <em>{_('noUserFound')}</em>
          </p>
        ) : (
          <SortedTable
            actions={USER_ACTIONS}
            collection={users}
            columns={USER_COLUMNS}
            data-groups={groups}
            stateUrlParam='s'
          />
        )}
      </div>
    )
  }
}
