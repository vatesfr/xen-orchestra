import _, { messages } from 'intl'
import ActionButton from 'action-button'
import Component from 'base-component'
import PropTypes from 'prop-types'
import React from 'react'
import SortedTable from 'sorted-table'
import { conditionalTooltip } from 'tooltip'
import { addSubscriptions } from 'utils'
import { createSelector } from 'selectors'
import { includes, isEmpty, keyBy, map, size } from 'lodash'
import { injectIntl } from 'react-intl'
import { SelectSubject } from 'select-objects'
import { Text } from 'editable'

import {
  addUserToGroup,
  createGroup,
  deleteGroup,
  deleteGroups,
  removeUserFromGroup,
  setGroupName,
  subscribeGroups,
  subscribePlugins,
  subscribeUsers,
  synchronizeLdapGroups,
} from 'xo'

@addSubscriptions({
  users: cb => subscribeUsers(users => cb(keyBy(users, 'id'))),
})
class UserDisplay extends Component {
  static propTypes = {
    id: PropTypes.string.isRequired, // user id
    group: PropTypes.object.isRequired, // group
  }

  _removeUser = () => {
    const { id, group } = this.props
    return removeUserFromGroup(id, group)
  }

  render() {
    const { id, users, canRemove } = this.props

    return (
      <span>
        {(id && users && users[id] && users[id].email) || (
          <em>
            &lt;
            {_('unknownUser')}
            &gt;
          </em>
        )}{' '}
        {canRemove && (
          <ActionButton
            className='pull-right'
            btnStyle='primary'
            size='small'
            icon='remove'
            handler={this._removeUser}
          />
        )}
      </span>
    )
  }
}

class GroupMembersDisplay extends Component {
  _toggle = () => this.setState({ open: !this.state.open })

  render() {
    const { group } = this.props
    return (
      <div>
        {isEmpty(group.users) ? (
          <em>{_('noUserInGroup')}</em>
        ) : (
          <div>
            <div>
              {_('countUsers', { users: size(group.users) })}
              <ActionButton
                className='pull-right'
                size='small'
                icon={this.state.open ? 'minus' : 'plus'}
                handler={this._toggle}
              />
            </div>
            {this.state.open && (
              <div className='mt-1'>
                <ul className='list-group'>
                  {map(group.users, user => (
                    <li className='list-group-item' key={user}>
                      <UserDisplay id={user} group={group} canRemove={group.provider === undefined} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }
}

const getPredicate = users => entity => entity.email && !includes(users, entity.id) // Entity is a user and is not already in list

const GROUP_COLUMNS = [
  {
    name: _('groupNameColumn'),
    itemRenderer: group =>
      group.provider === undefined ? (
        <Text value={group.name} onChange={value => setGroupName(group, value)} />
      ) : (
        group.name
      ),
    sortCriteria: group => group.name,
  },
  {
    name: _('groupUsersColumn'),
    itemRenderer: group => <GroupMembersDisplay group={group} />,
  },
  {
    name: _('addUserToGroupColumn'),
    itemRenderer: group =>
      group.provider === undefined ? (
        <SelectSubject
          predicate={getPredicate(group.users)}
          onChange={user => user && addUserToGroup(user, group)}
          value={null}
        />
      ) : null,
  },
]

const ACTIONS = [
  {
    handler: deleteGroups,
    icon: 'delete',
    individualHandler: deleteGroup,
    individualLabel: _('deleteGroup'),
    label: _('deleteSelectedGroups'),
    level: 'danger',
  },
]

@addSubscriptions({
  groups: subscribeGroups,
  plugins: subscribePlugins,
})
@injectIntl
export default class Groups extends Component {
  _createGroup = () => {
    const { name } = this.refs
    if (name) {
      return createGroup(name.value).then(() => {
        name.value = ''
      })
    }
  }

  _isLdapGroupSyncConfigured = createSelector(
    () => this.props.plugins,
    plugins => {
      if (plugins === undefined) {
        return false
      }

      const ldapPlugin = plugins.find(({ name }) => name === 'auth-ldap')
      if (ldapPlugin === undefined) {
        return false
      }

      return ldapPlugin.loaded && ldapPlugin.configuration.groups !== undefined
    }
  )

  render() {
    const { groups, intl } = this.props
    const disableLdapGroupSync = !this._isLdapGroupSyncConfigured()

    return (
      <div>
        {conditionalTooltip(
          <ActionButton
            btnStyle='primary'
            className='mr-1 mb-1'
            disabled={disableLdapGroupSync}
            handler={synchronizeLdapGroups}
            icon='refresh'
          >
            {_('syncLdapGroups')}
          </ActionButton>,
          disableLdapGroupSync ? _('ldapPluginNotConfigured') : undefined
        )}
        <form id='newGroupForm' className='form-inline'>
          <div className='form-group'>
            <input
              type='text'
              ref='name'
              placeholder={intl.formatMessage(messages.newGroupName)}
              required
              className='form-control'
            />
          </div>{' '}
          <div className='form-group'>
            <ActionButton form='newGroupForm' icon='add' btnStyle='success' handler={this._createGroup}>
              {_('createGroupButton')}
            </ActionButton>
          </div>
        </form>
        <hr />
        {isEmpty(groups) ? (
          <p>
            <em>{_('noGroupFound')}</em>
          </p>
        ) : (
          <SortedTable actions={ACTIONS} collection={groups} columns={GROUP_COLUMNS} stateUrlParam='s' />
        )}
      </div>
    )
  }
}
