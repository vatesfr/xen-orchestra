import * as Editable from 'editable'
import _, { messages } from 'intl'
import ActionButton from 'action-button'
import ActionRowButton from 'action-row-button'
import isEmpty from 'lodash/isEmpty'
import keyBy from 'lodash/keyBy'
import map from 'lodash/map'
import React, { Component } from 'react'
import SortedTable from 'sorted-table'
import { addSubscriptions } from 'utils'
import { injectIntl } from 'react-intl'
import { Password, Select } from 'form'

import {
  createUser,
  deleteUser,
  editUser,
  subscribeUsers
} from 'xo'

const permissions = {
  none: {
    label: _('userLabel'),
    value: 'none'
  },
  admin: {
    label: _('adminLabel'),
    value: 'admin'
  }
}

const USER_COLUMNS = [
  {
    name: _('userNameColumn'),
    itemRenderer: user => <Editable.Text onChange={email => editUser(user, {email})} value={user.email} />,
    sortCriteria: user => user.email
  },
  {
    name: _('userPermissionColumn'),
    itemRenderer: user => <Select
      clearable={false}
      value={user.permission}
      ref='permission'
      onChange={permission => editUser(user, {permission: permission.value})}
      options={map(permissions)}
    />,
    sortCriteria: user => user.permission
  },
  {
    name: _('userPasswordColumn'),
    itemRenderer: user => <Editable.Password onChange={password => editUser(user, { password })} value='' />
  },
  {
    name: '',
    itemRenderer: user => <ActionRowButton icon='delete' handler={deleteUser} handlerParam={user} btnStyle='danger' />
  }
]

@addSubscriptions({
  users: cb => subscribeUsers(users => cb(keyBy(users, 'id')))
})
@injectIntl
export default class Users extends Component {
  _create = () => {
    const {email, permission, password} = this.refs
    return createUser(email.value, password.value, permission.value)
      .then(() => {
        email.value = password.value = ''
        permission.value = permissions.none.value
      })
  }

  render () {
    const { users, intl } = this.props

    return <div>
      <form id='newUserForm' className='form-inline'>
        <div className='form-group'>
          <input
            type='text'
            ref='email'
            className='form-control'
            placeholder={intl.formatMessage(messages.userName)}
            required
          />
        </div>
        {' '}
        <div className='form-group'>
          <Select
            clearable={false}
            ref='permission'
            options={map(permissions)}
            placeholder={intl.formatMessage(messages.selectPermission)}
            required
          />
        </div>
        {' '}
        <div className='form-group'>
          <Password
            enableGenerator
            placeholder={intl.formatMessage(messages.userPassword)}
            ref='password'
            required
          />
        </div>
        {' '}
        <ActionButton form='newUserForm' icon='add' btnStyle='success' handler={this._create}>{_('createUserButton')}</ActionButton>
      </form>
      <hr />
      {isEmpty(users)
        ? <p><em>{_('noUserFound')}</em></p>
        : <SortedTable collection={users} columns={USER_COLUMNS} />}
    </div>
  }
}
