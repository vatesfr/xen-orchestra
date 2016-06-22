import * as Editable from 'editable'
import ActionButton from 'action-button'
import ActionRowButton from 'action-row-button'
import isEmpty from 'lodash/isEmpty'
import keyBy from 'lodash/keyBy'
import map from 'lodash/map'
import React, { Component } from 'react'
import SortedTable from 'sorted-table'
import { addSubscriptions } from 'utils'
import { Password, Select } from 'form'

import {
  createUser,
  deleteUser,
  editUser,
  subscribeUsers
} from 'xo'

const permissions = {
  none: {
    label: 'User',
    value: 'none'
  },
  admin: {
    label: 'Admin',
    value: 'admin'
  }
}

const USER_COLUMNS = [
  {
    name: 'Email',
    itemRenderer: user => <Editable.Text onChange={email => editUser(user, {email})} placeholder='email' value={user.email} />,
    sortCriteria: user => user.email
  },
  {
    name: 'Permissions',
    itemRenderer: user => <Select
      clearable={false}
      value={user.permission}
      ref='permission'
      onChange={permission => editUser(user, {permission: permission.value})}
      options={map(permissions)}
    />,
    sortCriteria: user => {
      return permissions[user.permission].label.toLowerCase()
    }
  },
  {
    name: 'Password',
    itemRenderer: user => <Editable.Password onChange={password => editUser(user, { password })} placeholder='password' value='' />
  },
  {
    name: '',
    itemRenderer: user => <ActionRowButton icon='delete' handler={deleteUser} handlerParam={user} btnStyle='danger' />
  }
]

@addSubscriptions({
  users: cb => subscribeUsers(users => cb(keyBy(users, 'id')))
})
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
    const { users } = this.props

    return <div>
      <form id='newUserForm' className='form-inline'>
        <div className='form-group'>
          <input
            type='text'
            ref='email'
            className='form-control'
            placeholder='email'
            required
          />
        </div>
        {' '}
        <div className='form-group'>
          <select
            className='form-control'
            defaultValue={permissions.user}
            ref='permission'
            required
          >
            {map(permissions, (p, k) => <option key={k} value={p.value}>{p.label}</option>)}
          </select>
        </div>
        {' '}
        <div className='form-group'>
          <Password
            enableGenerator
            placeholder='password'
            ref='password'
            required
          />
        </div>
        {' '}
        <ActionButton form='newUserForm' icon='add' btnStyle='success' handler={this._create}>Create</ActionButton>
      </form>
      <hr />
      {isEmpty(users)
        ? <p><em>No users found</em></p>
        : <SortedTable collection={users} columns={USER_COLUMNS} />}
    </div>
  }
}
