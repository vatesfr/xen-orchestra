import _ from 'intl'
import ActionButton from 'action-button'
import ButtonGroup from 'button-group'
import Component from 'base-component'
import decorate from 'apply-decorators'
import filter from 'lodash/filter'
import forEach from 'lodash/forEach'
import isEmpty from 'lodash/isEmpty'
import keyBy from 'lodash/keyBy'
import map from 'lodash/map'
import React from 'react'
import renderXoItem, { renderXoItemFromId } from 'render-xo-item'
import some from 'lodash/some'
import SortedTable from 'sorted-table'
import toArray from 'lodash/toArray'
import Upgrade from 'xoa-upgrade'
import store from 'store'
import { addSubscriptions, connectStore } from 'utils'
import { Container } from 'grid'
import { error } from 'notification'
import { injectState, provideState } from 'reaclette'
import { SelectHighLevelObject, SelectRole, SelectSubject } from 'select-objects'

import { createGetObjectsOfType, createSelector } from 'selectors'

import {
  addAcl,
  editAcl,
  removeAcl,
  removeAcls,
  subscribeAcls,
  subscribeGroups,
  subscribeRoles,
  subscribeUsers,
} from 'xo'

const TYPES = ['VM', 'host', 'pool', 'SR', 'network']

const ACL_COLUMNS = [
  {
    name: _('subjectName'),
    itemRenderer: acl => (acl.subject.id ? renderXoItem(acl.subject) : renderXoItemFromId(acl.subject)),
    sortCriteria: acl => (acl.subject.name || acl.subject.email || '').toLowerCase(),
  },
  {
    name: _('objectName'),
    itemRenderer: acl => (acl.object.id ? renderXoItem(acl.object) : renderXoItemFromId(acl.object)),
    sortCriteria: acl => (acl.object.name || acl.object.name_label || '').toLowerCase(),
  },
  {
    name: _('roleName'),
    itemRenderer: acl => (
      <SelectRole clearable={false} onChange={action => action && editAcl(acl, { action })} value={acl.action} />
    ),
    sortCriteria: acl => (acl.action.name || '').toLowerCase(),
  },
]

const ACL_ACTIONS = [
  {
    handler: removeAcls,
    icon: 'delete',
    individualHandler: removeAcl,
    individualLabel: _('deleteAcl'),
    label: _('deleteSelectedAcls'),
    level: 'danger',
  },
]

const AclTable = decorate([
  connectStore({
    hosts: createGetObjectsOfType('host'),
    networks: createGetObjectsOfType('network'),
    pools: createGetObjectsOfType('pool'),
    srs: createGetObjectsOfType('SR'),
    vms: createGetObjectsOfType('VM'),
  }),
  addSubscriptions({
    acls: subscribeAcls,
    roles: subscribeRoles,
    groups: subscribeGroups,
    users: subscribeUsers,
  }),
  provideState({
    computed: {
      acls: ({ groups, roles, users }, { acls, hosts, networks, pools, srs, vms }) =>
        filter(
          map(acls, ({ id, subject, object, action }) => ({
            id,
            subject: users[subject] || groups[subject],
            object: hosts[object] || networks[object] || pools[object] || srs[object] || vms[object],
            action: roles[action],
          })),
          ({ subject, object, action }) => subject !== undefined && object !== undefined && action !== undefined
        ),
      groups: (_, { groups }) => keyBy(groups, 'id'),
      roles: (_, { roles }) => keyBy(roles, 'id'),
      users: (_, { users }) => keyBy(users, 'id'),
    },
  }),
  injectState,
  ({ state }) => <SortedTable actions={ACL_ACTIONS} collection={state.acls} columns={ACL_COLUMNS} stateUrlParam='s' />,
])

export default class Acls extends Component {
  constructor(props) {
    super(props)
    this.state = {
      action: undefined,
      objects: [],
      subjects: [],
      typeFilters: {},
    }
  }

  _toggleTypeFilter = type => {
    const { someTypeFilters, typeFilters, objects } = this.state

    const newTypeFilters = { ...typeFilters, [type]: !typeFilters[type] }
    const newSomeTypeFilters = some(newTypeFilters)

    // If some objects need to be removed from the selected objects
    if (!newTypeFilters[type] || (!someTypeFilters && newSomeTypeFilters)) {
      this.setState({
        objects: filter(objects, ({ type }) => !newSomeTypeFilters || newTypeFilters[type]),
      })
    }

    this.setState(
      {
        typeFilters: { ...typeFilters, [type]: !typeFilters[type] },
        someTypeFilters: some(newTypeFilters),
      },
      () => {
        // If some objects need to be removed from the selected objects
        if (!this.state.typeFilters[type] || (!someTypeFilters && this.state.someTypeFilters)) {
          this.setState({
            objects: filter(objects, this._getObjectPredicate()),
          })
        }
      }
    )
  }

  _getObjectPredicate = createSelector(
    () => this.state.typeFilters,
    () => this.state.someTypeFilters,
    (typeFilters, someTypeFilters) =>
      ({ type }) =>
        !someTypeFilters || typeFilters[type]
  )

  _selectAll = () => {
    const { someTypeFilters, typeFilters } = this.state

    const objects = []
    forEach(TYPES, type => {
      if (!someTypeFilters || typeFilters[type]) {
        const typeObjects = createGetObjectsOfType(type)(store.getState())
        objects.push(...toArray(typeObjects))
      }
    })
    this.setState({ objects })
  }

  _addAcl = async () => {
    const { subjects, objects, action } = this.state
    try {
      const promises = []
      forEach(subjects, subject => {
        forEach(objects, object => {
          promises.push(addAcl({ subject, object, action }))
        })
      })
      await Promise.all(promises)

      this.setState({
        subjects: [],
        objects: [],
        action: undefined,
      })
    } catch (err) {
      error('Add ACL(s)', err.message || String(err))
    }
  }

  render() {
    const { typeFilters, objects, action, subjects } = this.state

    return process.env.XOA_PLAN > 2 ? (
      <Container>
        <form>
          <div className='form-group'>
            <SelectSubject multi onChange={this.linkState('subjects')} value={subjects} />
          </div>
          <div className='form-group'>
            <SelectHighLevelObject
              multi
              onChange={this.linkState('objects')}
              value={objects}
              predicate={this._getObjectPredicate()}
            />
          </div>
          <div className='form-group mb-1'>
            <ButtonGroup>
              {map(TYPES, type => (
                <ActionButton
                  btnStyle={typeFilters[type] ? 'success' : 'secondary'}
                  handler={this._toggleTypeFilter}
                  handlerParam={type}
                  icon={type.toLowerCase()}
                  key={type}
                  size='small'
                  tooltip={_('settingsAclsButtonTooltip' + type)}
                />
              ))}
            </ButtonGroup>{' '}
            <ActionButton tooltip='Select all' size='small' icon='add' handler={this._selectAll} />
          </div>
          <div className='form-group'>
            <SelectRole onChange={this.linkState('action')} value={action} />
          </div>
          <ActionButton
            icon='add'
            btnStyle='success'
            handler={this._addAcl}
            disabled={isEmpty(subjects) || isEmpty(objects) || !action}
          >
            {_('aclCreate')}
          </ActionButton>
        </form>
        <br />
        <AclTable />
      </Container>
    ) : (
      <Container>
        <Upgrade place='dashboard' available={3} />
      </Container>
    )
  }
}
