import ActionButton from 'action-button'
import forEach from 'lodash/forEach'
import includes from 'lodash/includes'
import isEmpty from 'lodash/isEmpty'
import keyBy from 'lodash/keyBy'
import map from 'lodash/map'
import orderBy from 'lodash/orderBy'
import React, { Component } from 'react'
import { confirm } from 'modal'
import { error } from 'notification'
import { SelectSubject } from 'select-objects'

import {
  addUserToGroup,
  createGroup,
  deleteGroup,
  removeUserFromGroup,
  setGroupName,
  subscribeGroups,
  subscribeUsers
} from 'xo'

const refreshSubs = () => {
  subscribeGroups.forceRefresh()
  subscribeUsers.forceRefresh()
}

/**
 * @prop id: the id of a xo user
 * @prop group: the id of a xo group
 */
class UserDisplay extends Component {
  constructor (props) {
    super(props)
    this.state = {
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
    return removeUserFromGroup(id, group)
      .then(() => subscribeGroups.forceRefresh())
      .catch(err => error('Remove User', err.message || String(err)))
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
      groups: [],
      saveNameButtons: undefined
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
      return createGroup(name.value)
        .then(() => {
          subscribeGroups.forceRefresh()
          name.value = ''
        })
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
      .then(() => subscribeGroups.forceRefresh())
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
      .then(refreshSubs)
      .catch(err => error('Add User', err.message || String(err)))
  }

  _handleNameChange = () => !this.state.saveNameButtons && this.setState({saveNameButtons: true})
  _saveNames = () => {
    const { groups } = this.state
    const { refs } = this
    const promises = []
    forEach(groups, group => {
      const ref = refs[`name-${group.id}`]
      ref && !isEmpty(ref.value) && group.name !== ref.value && promises.push(setGroupName(group.id, ref.value))
    })
    return Promise.all(promises)
      .then(() => {
        this.setState({saveNameButtons: undefined})
        subscribeGroups.forceRefresh()
      })
      .catch(err => error('Rename group(s)', err.message || String(err)))
  }
  _resetNames = () => {
    const { groups } = this.state
    const { refs } = this
    forEach(groups, group => {
      const ref = refs[`name-${group.id}`]
      ref && (ref.value = group.name)
    })
    this.setState({saveNameButtons: undefined})
  }

  render () {
    const {
      groups,
      saveNameButtons
    } = this.state

    return <div>
      <form>
        <table className='table'>
          <thead>
            <tr>
              <th>
                Name{saveNameButtons &&
                  <span>
                    {' '}
                    <ActionButton icon='save' handler={this._saveNames} btnStyle='primary' size='small' />
                    {' '}
                    <ActionButton icon='undo' handler={this._resetNames} btnStyle='default' size='small' />
                  </span>
                }
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
                    <input type='text' ref={`name-${group.id}`} defaultValue={group.name} className='form-control' onChange={this._handleNameChange} />
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
