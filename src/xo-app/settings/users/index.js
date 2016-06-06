import ActionButton from 'action-button'
import ActionRowButton from 'action-row-button'
import isEmpty from 'lodash/isEmpty'
import keyBy from 'lodash/keyBy'
import map from 'lodash/map'
import React, { Component } from 'react'
import { addSubscriptions } from 'utils'
import { confirm } from 'modal'
import { error } from 'notification'
import { Password } from 'form'
import * as Editable from 'editable'

import {
  createUser,
  deleteUser,
  subscribeUsers,
  updateUser
} from 'xo'

const permissions = {
  user: {
    label: 'User',
    value: 'none'
  },
  admin: {
    label: 'Admin',
    value: 'admin'
  }
}

class UserTableRow extends Component {
  constructor (props) {
    super(props)
    this.state = {
      changing: undefined
    }
  }

  _handleChange = () => !this.state.changing && this.setState({changing: true})

  _reset = () => {
    const { user } = this.props
    const {email, permission, password} = this.refs
    email.value = user.email
    permission.value = user.permission
    password.value = ''
    this.setState({changing: undefined})
  }

  _save = async id => {
    const { email, password, permission } = this.refs
    try {
      await confirm({
        title: 'Modifiy user',
        body: <p>Are you sure you want to save these changes ?</p>
      })
      const params = {
        email: email.value,
        password: password.value,
        permission: permission.value
      }
      return updateUser(id, params)
        .then(() => {
          password.value = ''
          this.setState({changing: undefined})
        })
        .catch(err => error('Modify user', err.message || String(err)))
    } catch (_) {
      return
    }
  }

  _delete = async id => {
    try {
      await confirm({
        title: 'Delete user',
        body: <p>Are you sure you want to delete this user ?</p>
      })
      return deleteUser(id)
        .catch(err => error('Modify user', err.message || String(err)))
    } catch (_) {
      return
    }
  }

  _setEmail = email => updateUser(this.props.user, { email })
  _setPermission = permission => updateUser(this.props.user, { permission })
  _setPassword = password => updateUser(this.props.user, { password })

  render () {
    const { user } = this.props
    return <tr>
      <td>
        <Editable.Text
          onChange={this._setEmail}
          placeholder='email'
          value={user.email}
        />
      </td>
      <td>
        <div className='form-group'>
          <select
            className='form-control'
            defaultValue={user.permission}
            ref='permission'
            onChange={this._handleChange}
            required
          >
            {map(permissions, (p, k) => <option key={k} value={p.value}>{p.label}</option>)}
          </select>
        </div>
      </td>
      <td>
        <Editable.Password
          onChange={this._setPassword}
          placeholder='password'
          value=''
        />
      </td>
      <td>
        {!this.state.changing && <ActionRowButton icon='delete' handler={this._delete} handlerParam={user.id} btnStyle='danger' />}
        {this.state.changing &&
          <span>
            <ActionRowButton icon='save' handler={this._save} handlerParam={user.id} btnStyle='primary' />
            {' '}
            <ActionRowButton icon='undo' handler={this._reset} handlerParam={user.id} btnStyle='default' />
          </span>
        }
      </td>
    </tr>
  }
}

@addSubscriptions({
  users: cb => subscribeUsers(users => cb(keyBy(users, 'id')))
})
export default class Users extends Component {
  _create = () => {
    const {email, permission, password} = this.refs
    return createUser(email.value, password.value, permission.value)
      .then(() => {
        email.value = password.value = ''
        permission.value = permissions.user.value
      }).catch(err => error('Create user', err.message || String(err)))
  }

  render () {
    const { users } = this.props

    return <div>
      <table className='table table-striped'>
        <thead>
          <tr>
            <th>Email</th>
            <th>Permissions</th>
            <th>Password</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {isEmpty(users) && <tr><td><em>No users found</em></td></tr>}
          {map(users, user => <UserTableRow key={user.id} user={user} />)}
        </tbody>
      </table>
      <hr />
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
    </div>
  }
}
