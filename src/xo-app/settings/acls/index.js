import _ from 'intl'
import ActionButton from 'action-button'
import ActionRowButton from 'action-row-button'
import Component from 'base-component'
import filter from 'lodash/filter'
import forEach from 'lodash/forEach'
import isEmpty from 'lodash/isEmpty'
import keyBy from 'lodash/keyBy'
import map from 'lodash/map'
import pickBy from 'lodash/pickBy'
import React from 'react'
import renderXoItem, { renderXoItemFromId } from 'render-xo-item'
import some from 'lodash/some'
import SortedTable from 'sorted-table'
import toArray from 'lodash/toArray'
import Upgrade from 'xoa-upgrade'
import store from 'store'
import { connectStore } from 'utils'
import { Container } from 'grid'
import { error } from 'notification'
import { SelectHighLevelObject, SelectRole, SelectSubject } from 'select-objects'
import { ButtonGroup } from 'react-bootstrap-4/lib'

import {
  createGetObjectsOfType,
  createSelector
} from 'selectors'

import {
  addAcl,
  editAcl,
  removeAcl,
  subscribeAcls,
  subscribeGroups,
  subscribeRoles,
  subscribeUsers
} from 'xo'

const TYPES = [
  'VM',
  'host',
  'pool',
  'SR',
  'network'
]

const ACL_COLUMNS = [
  {
    name: _('subjectName'),
    itemRenderer: acl => acl.subject.id ? renderXoItem(acl.subject) : renderXoItemFromId(acl.subject),
    sortCriteria: acl => (acl.subject.name || acl.subject.email || '').toLowerCase()
  },
  {
    name: _('objectName'),
    itemRenderer: acl => acl.object.id ? renderXoItem(acl.object) : renderXoItemFromId(acl.object),
    sortCriteria: acl => (acl.object.name || acl.object.name_label || '').toLowerCase()
  },
  {
    name: _('roleName'),
    itemRenderer: acl => <SelectRole clearable={false} onChange={action => action && editAcl(acl, { action })} value={acl.action} />,
    sortCriteria: acl => (acl.action.name || '').toLowerCase()
  },
  {
    name: '',
    itemRenderer: acl => <ActionRowButton icon='delete' btnStyle='danger' handler={removeAcl} handlerParam={acl} />
  }
]

@connectStore(() => {
  const getHighLevelObjects = createSelector(
    createGetObjectsOfType('host'),
    createGetObjectsOfType('network'),
    createGetObjectsOfType('pool'),
    createGetObjectsOfType('SR'),
    createGetObjectsOfType('VM'),
    createGetObjectsOfType('VM-snapshot'),
    (hosts, networks, pools, srs, vms, snapshots) => ({
      ...keyBy(hosts, 'id'),
      ...keyBy(networks, 'id'),
      ...keyBy(pools, 'id'),
      ...keyBy(snapshots, 'id'),
      ...keyBy(srs, 'id'),
      ...keyBy(vms, 'id')
    })
  )
  return {xoObjects: getHighLevelObjects}
})
class AclTable extends Component {
  componentWillMount () {
    let subjects = {}
    const refresh = (newSubjects = undefined) => {
      newSubjects && (subjects = newSubjects)
      const { xoObjects } = this.props
      const { acls, roles } = this.state
      const resolvedAcls = filter(
        map(acls, ({subject, object, action}) => ({
          subject: subjects[subject] || subject,
          object: xoObjects[object] || object,
          action: roles[action] || action
        })),
        ({ subject, object, action }) => subject && object && action && object.type !== 'VM-snapshot'
      )
      this.setState({
        resolvedAcls
      })
    }

    const unsubscribeAcls = subscribeAcls(acls => this.setState({acls}, refresh))
    const unsubscribeRoles = subscribeRoles(roles => this.setState({roles: keyBy(roles, 'id')}, refresh))
    const unsubscribeGroups = subscribeGroups(groups => {
      groups = keyBy(groups, 'id')
      refresh({
        ...pickBy(subjects, subject => subject.type === 'user'),
        ...groups
      })
    })
    const unsubscribeUsers = subscribeUsers(users => {
      users = keyBy(users, 'id')
      refresh({
        ...pickBy(subjects, subject => subject.type === 'group'),
        ...users
      })
    })

    this.componentWillUnmount = () => {
      unsubscribeAcls()
      unsubscribeGroups()
      unsubscribeRoles()
      unsubscribeUsers()
    }
  }

  render () {
    const { resolvedAcls = [] } = this.state

    return isEmpty(resolvedAcls)
      ? <p><em>{_('aclNoneFound')}</em></p>
      : <SortedTable collection={resolvedAcls} columns={ACL_COLUMNS} />
  }
}

export default class Acls extends Component {
  constructor (props) {
    super(props)
    this.state = {
      action: '',
      objects: [],
      subjects: [],
      typeFilters: {}
    }
  }

  _toggleTypeFilter = type => {
    const {
      someTypeFilters,
      typeFilters,
      objects
    } = this.state

    const newTypeFilters = { ...typeFilters, [type]: !typeFilters[type] }
    const newSomeTypeFilters = some(newTypeFilters)

    // If some objects need to be removed from the selected objects
    if (!newTypeFilters[type] || !someTypeFilters && newSomeTypeFilters) {
      this.setState({
        objects: filter(objects, ({ type }) => !newSomeTypeFilters || newTypeFilters[type])
      })
    }

    this.setState({
      typeFilters: { ...typeFilters, [type]: !typeFilters[type] },
      someTypeFilters: some(newTypeFilters)
    }, () => {
      // If some objects need to be removed from the selected objects
      if (!this.state.typeFilters[type] || !someTypeFilters && this.state.someTypeFilters) {
        this.setState({
          objects: filter(objects, this._getObjectPredicate())
        })
      }
    })
  }

  _getObjectPredicate = createSelector(
    () => this.state.typeFilters,
    () => this.state.someTypeFilters,
    (typeFilters, someTypeFilters) => ({ type }) =>
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
    const {
      subjects,
      objects,
      action
    } = this.state
    try {
      const promises = []
      forEach(subjects, subject => {
        forEach(objects, object => {
          promises.push(addAcl({subject, object, action}))
        })
      })
      await Promise.all(promises)

      this.setState({
        subjects: [],
        objects: [],
        action: ''
      })
    } catch (err) {
      error('Add ACL(s)', err.message || String(err))
    }
  }

  render () {
    const {
      typeFilters,
      objects,
      action,
      subjects
    } = this.state

    return process.env.XOA_PLAN > 2
      ? <Container>
        <form>
          <div className='form-group'>
            <SelectSubject multi onChange={this.linkState('subjects')} value={subjects} />
          </div>
          <div className='form-group'>
            <SelectHighLevelObject multi onChange={this.linkState('objects')} value={objects} predicate={this._getObjectPredicate()} />
          </div>
          <div className='form-group mb-1'>
            <ButtonGroup className='mr-1'>
              {map(TYPES, type =>
                <ActionButton
                  btnStyle={typeFilters[type] ? 'success' : 'secondary'}
                  handler={this._toggleTypeFilter}
                  handlerParam={type}
                  icon={type.toLowerCase()}
                  key={type}
                  size='small'
                  tooltip={_('settingsAclsButtonTooltip' + type)}
                />
              )}
            </ButtonGroup>
            <ActionButton tooltip='Select all' btnStyle='secondary' size='small' icon='add' handler={this._selectAll} />
          </div>
          <div className='form-group'>
            <SelectRole onChange={this.linkState('action')} value={action} />
          </div>
          <ActionButton icon='add' btnStyle='success' handler={this._addAcl} disabled={isEmpty(subjects) || isEmpty(objects) || !action}>{_('aclCreate')}</ActionButton>
        </form>
        <br />
        <AclTable />
      </Container>
    : <Container><Upgrade place='dashboard' available={3} /></Container>
  }
}
