import _, { messages } from 'intl'
import ActionButton from 'action-button'
import Component from 'base-component'
import includes from 'lodash/includes'
import isEmpty from 'lodash/isEmpty'
import keyBy from 'lodash/keyBy'
import map from 'lodash/map'
import propTypes from 'prop-types'
import React from 'react'
import size from 'lodash/size'
import SortedTable from 'sorted-table'
import { addSubscriptions } from 'utils'
import { injectIntl } from 'react-intl'
import { SelectSubject } from 'select-objects'
import { Text } from 'editable'

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
  group: propTypes.object.isRequired // group
})
class UserDisplay extends Component {
  _removeUser = () => {
    const {id, group} = this.props
    return removeUserFromGroup(id, group)
  }

  render () {
    const { id, users } = this.props

    return <span>
      {id && (users && users[id] && users[id].email) || <em>&lt;{_('unknownUser')}&gt;</em>}
      {' '}
      <ActionButton className='pull-right' btnStyle='primary' size='small' icon='remove' handler={this._removeUser} />
    </span>
  }
}

class GroupMembersDisplay extends Component {
  _toggle = () => this.setState({open: !this.state.open})

  render () {
    const { group } = this.props
    return <div>
      {isEmpty(group.users)
        ? <em>{_('noUserInGroup')}</em>
        : <div>
          <div>
            {_('countUsers', {users: size(group.users)})}
            <ActionButton className='pull-right' size='small' icon={this.state.open ? 'minus' : 'plus'} handler={this._toggle} />
          </div>
          {this.state.open &&
            <div className='mt-1'>
              <ul className='list-group'>
                {map(group.users, user => <li className='list-group-item' key={user}><UserDisplay id={user} group={group} /></li>)}
              </ul>
            </div>}
        </div>}
    </div>
  }
}

const getPredicate = users => entity => entity.email && !includes(users, entity.id) // Entity is a user and is not already in list

const GROUP_COLUMNS = [
  {
    name: _('groupNameColumn'),
    itemRenderer: group => <Text value={group.name} onChange={value => setGroupName(group, value)} />,
    sortCriteria: group => group.name
  },
  {
    name: _('groupUsersColumn'),
    itemRenderer: group => <GroupMembersDisplay group={group} />
  },
  {
    name: _('addUserToGroupColumn'),
    itemRenderer: group => <SelectSubject predicate={getPredicate(group.users)} onChange={user => user && addUserToGroup(user, group)} defaultValue={null} />
  },
  {
    name: '',
    itemRenderer: group => <ActionButton icon='delete' handler={deleteGroup} handlerParam={group} btnStyle='danger' />
  }
]

@addSubscriptions({
  groups: subscribeGroups
})
@injectIntl
export default class Groups extends Component {
  _createGroup = () => {
    const { name } = this.refs
    if (name) {
      return createGroup(name.value)
        .then(() => { name.value = '' })
    }
  }

  render () {
    const { groups, intl } = this.props

    return <div>
      <form id='newGroupForm' className='form-inline'>
        <div className='form-group'>
          <input type='text' ref='name' placeholder={intl.formatMessage(messages.newGroupName)} required className='form-control' />
        </div>
        {' '}
        <div className='form-group'>
          <ActionButton form='newGroupForm' icon='add' btnStyle='success' handler={this._createGroup}>{_('createGroupButton')}</ActionButton>
        </div>
      </form>
      <hr />
      {isEmpty(groups)
        ? <p><em>{_('noGroupFound')}</em></p>
        : <SortedTable collection={groups} columns={GROUP_COLUMNS} />}
    </div>
  }
}
