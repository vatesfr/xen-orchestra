import ActionButton from 'action-button'
import includes from 'lodash/includes'
import isEmpty from 'lodash/isEmpty'
import keyBy from 'lodash/keyBy'
import map from 'lodash/map'
import React, { Component } from 'react'
import { confirm } from 'modal'
import { error } from 'notification'
import { SelectSubject } from 'select-objects'
import { Text } from 'editable'
import {
  addSubscriptions,
  propTypes
} from 'utils'
import {
  addUserToGroup,
  createGroup,
  deleteGroup,
  removeUserFromGroup,
  setGroupName,
  subscribeGroups,
  subscribeUsers
} from 'xo'

@addSubscriptions({
  users: cb => subscribeUsers(users => cb(keyBy(users, 'id')))
})
@propTypes({
  id: propTypes.string.isRequired, // user id
  group: propTypes.string.isRequired // group id
})
class UserDisplay extends Component {
  _removeUser = () => {
    const {id, group} = this.props
    return removeUserFromGroup(id, group)
      .catch(err => error('Remove User', err.message || String(err)))
  }

  render () {
    const { id, users } = this.props

    return <span>
      {id && (users && users[id] && users[id].email) || <em>&lt;unknown user or group&gt;</em>}
      {' '}
      <ActionButton btnStyle='primary' size='small' icon='remove' handler={this._removeUser} />
    </span>
  }
}

@addSubscriptions({
  groups: subscribeGroups
})
export default class Groups extends Component {
  _createGroup = () => {
    const { name } = this.refs
    if (name) {
      return createGroup(name.value)
        .then(() => { name.value = '' })
        .catch(err => error('Create Group', err.message || String(err)))
    }
  }

  _deleteGroup = async id => {
    try {
      await confirm({
        title: 'Delete group',
        body: <p>Are you sure you want to delete this group ?</p>
      })
      return deleteGroup(id)
      .catch(err => error('Delete Group', err.message || String(err)))
    } catch (_) {
      return
    }
  }

  _getPredicate = users => {
    return entity => entity.email && !includes(users, entity.id) // Entity is a user and is not already in list
  }

  _addUser = (user, group) => {
    return addUserToGroup(user.id, group.id)
      .catch(err => error('Add User', err.message || String(err)))
  }

  render () {
    const { groups } = this.props

    return <div>
      <form>
        <table className='table'>
          <thead>
            <tr>
              <th>
                Name
              </th>
              <th>Members</th>
              <th>Add member</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {isEmpty(groups) && <tr><td><em>No groups found</em></td></tr>}
            {map(groups, group =>
              <tr key={group.id}>
                <td>
                  <div className='form-group'>
                    <Text value={group.name} onChange={value => setGroupName(group.id, value)} />
                  </div>
                </td>
                <td>
                  {isEmpty(group.users) && <em>No users in group</em>}
                  {map(group.users, user => <span key={user}><UserDisplay id={user} group={group.id} /> </span>)}
                </td>
                <td>
                  <div className='form-group'>
                    <SelectSubject predicate={this._getPredicate(group.users)} onChange={user => this._addUser(user, group)} defaultValue={null} />
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
          <input type='text' ref='name' placeholder='New Group name' required className='form-control' />
        </div>
        {' '}
        <div className='form-group'>
          <ActionButton type='submit' form='newGroupForm' icon='add' btnStyle='success' handler={this._createGroup}>Create</ActionButton>
        </div>
      </form>
    </div>
  }
}
