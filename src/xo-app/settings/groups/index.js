import ActionButton from 'action-button'
import map from 'lodash/map'
import React, { Component } from 'react'
import { error } from 'notification'
import { SelectSubject } from 'select-objects'
import includes from 'lodash/includes'
import keyBy from 'lodash/keyBy'
import orderBy from 'lodash/orderBy'

import {
  addUserToGroup,
  createGroup,
  deleteGroup,
  removeUserFromGroup,
  subscribeGroups,
  subscribeUsers
} from 'xo'

const refreshSubs = () => {
  subscribeUsers.forceRefresh()
  subscribeGroups.forceRefresh()
}

class UserDisplay extends Component {
  constructor (props) {
    super(props)
    this.state = {
      groups: {},
      users: {}
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

  _removeUser = () => {
    const {id, group} = this.props
    return removeUserFromGroup({user: id, group}).then(() => subscribeGroups.forceRefresh()).catch(err => error('Remove User', err.message || String(err)))
  }

  render () {
    const { id } = this.props
    const {
      users
    } = this.state
    return <span>
      {id && (users[id] && users[id].email) || <em>&lt;unknown user or group&gt;</em>}
      {' '}
      <ActionButton btnStyle='primary' size='small' icon='remove' handler={this._removeUser} />
    </span>
  }
}

export default class Groups extends Component {
  constructor (props) {
    super(props)
    this.state = {
      groups: []
    }
  }

  componentWillMount () {
    const unsubscribeGroups = subscribeGroups(groups => this.setState({groups: orderBy(groups, ['name'])}))

    this.componentWillUnmount = () => {
      unsubscribeGroups()
    }
  }

  _createGroup = () => {
    const { name } = this.refs
    if (name) {
      return createGroup({name: name.value}).then(() => subscribeGroups.forceRefresh()).catch(err => error('Create Group', err.message || String(err)))
    }
  }

  _deleteGroup = id => deleteGroup({id}).then(() => subscribeGroups.forceRefresh()).catch(err => error('Delete Group', err.message || String(err)))

  _getPredicate = users => {
    return entity => entity.email && !includes(users, entity.id) // Entity is a user and is not already in list
  }

  _addUser = (user, group) => {
    return addUserToGroup({user: user.id, group: group.id}).then(refreshSubs).catch(err => error('Add User', err.message || String(err)))
  }

  render () {
    const {
      groups
    } = this.state

    return <div>
      <form>
        <table className='table'>
          <thead>
            <th>Name</th>
            <th>Members</th>
            <th>Add member</th>
            <th></th>
          </thead>
          <tbody>
            {map(groups, group =>
              <tr key={group.id}>
                <td>
                  <input type='text' ref={`name-${group.id}`} defaultValue={group.name} className='form-control' />
                </td>
                <td>
                  {map(group.users, user => <span key={user}><UserDisplay id={user} group={group.id} /> </span>)}
                </td>
                <td>
                  <div className='form-group'>
                    <SelectSubject className='form-control' predicate={this._getPredicate(group.users)} onChange={user => this._addUser(user, group)} defaultValue={null} />
                  </div>
                </td>
                <td>
                  <ActionButton icon='delete' handler={this._deleteGroup} handlerParam={group.id} btnStyle='danger' />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </form>
      <hr />
      <form id='newGroupForm' className='form-inline'>
        <div className='form-group'>
          <input type='text' ref='name' required className='form-control' />
        </div>
        {' '}
        <div className='form-group'>
          <ActionButton type='submit' form='newGroupForm' icon='add' btnStyle='success' handler={this._createGroup}>Create</ActionButton>
        </div>
      </form>
    </div>
  }
}
