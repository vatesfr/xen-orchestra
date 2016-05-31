import ActionButton from 'action-button'
import isEmpty from 'lodash/isEmpty'
import keyBy from 'lodash/keyBy'
import map from 'lodash/map'
import React, { Component } from 'react'
import { confirm } from 'modal'
import { error } from 'notification'
import { Password } from 'form'

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
          subscribeUsers.forceRefresh()
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
        .then(() => {
          subscribeUsers.forceRefresh()
        })
        .catch(err => error('Modify user', err.message || String(err)))
    } catch (_) {
      return
    }
  }

  render () {
    const { user } = this.props
    return <tr className='form-inline'>
      <td>
        <div className='form-group'>
          <input
            type='text'
            ref='email'
            className='form-control'
            placeholder='email'
            required
            defaultValue={user.email}
            onChange={this._handleChange}
          />
        </div>
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
        <Password
          enableGenerator={false}
          placeholder='password (refill to change)'
          ref='password'
          required
          onChange={this._handleChange}
        />
      </td>
      <td>
        {!this.state.changing && <ActionButton icon='delete' handler={this._delete} handlerParam={user.id} btnStyle='danger' />}
        {this.state.changing &&
          <span>
            <ActionButton icon='save' handler={this._save} handlerParam={user.id} btnStyle='primary' />
            {' '}
            <ActionButton icon='undo' handler={this._reset} handlerParam={user.id} btnStyle='default' />
          </span>
        }
      </td>
    </tr>
  }
}

export default class Users extends Component {
  constructor (props) {
    super(props)
    this.state = {
      users: []
    }
  }

  componentWillMount () {
    const unsubscribeUsers = subscribeUsers(users => {
      users = keyBy(users, 'id')
      this.setState({
        users
      })
    })

    this.componentWillUnmount = () => {
      unsubscribeUsers()
    }
  }

  _create = () => {
    const {email, permission, password} = this.refs
    return createUser(email.value, password.value, permission.value)
      .then(() => {
        subscribeUsers.forceRefresh()
        email.value = password.value = ''
        permission.value = permissions.user.value
      }).catch(err => error('Create user', err.message || String(err)))
  }

  render () {
    const {
      users
    } = this.state

    return <div>
      <table className='table'>
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
            enableGenerator={false}
            placeholder='password'
            ref='password'
            required
          />
        </div>
        {' '}
        <ActionButton type='submit' form='newUserForm' icon='add' btnStyle='success' handler={this._create}>Create</ActionButton>
      </form>
    </div>
  }
}
