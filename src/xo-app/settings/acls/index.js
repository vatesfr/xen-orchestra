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
    itemRenderer: acl => <SelectRole clearable={false} onChange={action => action && editAcl(acl, { action })} placeholder='Change Role' value={acl.action} />,
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
    (hosts, networks, pools, srs, vms) => ({
      ...keyBy(hosts, 'id'),
      ...keyBy(networks, 'id'),
      ...keyBy(pools, 'id'),
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
      const resolvedAcls = map(acls, ({subject, object, action}) => ({
        subject: subjects[subject] || subject,
        object: xoObjects[object] || object,
        action: roles[action] || action
      }))
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
      ? <p><em>No acls found</em></p>
      : <SortedTable collection={resolvedAcls} columns={ACL_COLUMNS} />
  }
}

export default class Acls extends Component {
  constructor (props) {
    super(props)
    this.state = {
      isAllSelected: {},
      subjects: [],
      objects: [],
      role: undefined
    }
  }

  _handleSelectObjects = objects => this.setState({objects})
  _handleSelectRole = action => this.setState({action})
  _handleSelectSubject = subjects => this.setState({subjects})

  _toggleAll = type => {
    const { isAllSelected, objects } = this.state
    let newObjects
    if (!isAllSelected[type]) {
      newObjects = [ ...objects, ...toArray(createGetObjectsOfType(type)(store.getState())) ]
    } else {
      newObjects = filter(objects, object => object.type !== type)
    }
    this.refs.selectObject.value = newObjects
    this.setState({
      objects: newObjects,
      isAllSelected: {
        ...isAllSelected,
        [type]: !isAllSelected[type] }
    })
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
      const { selectSubject, selectObject, selectAction } = this.refs
      selectSubject.value = []
      selectObject.value = []
      selectAction.value = ''
    } catch (err) {
      error('Add ACL(s)', err.message || String(err))
    }
  }

  render () {
    const {
      isAllSelected,
      objects,
      action,
      subjects
    } = this.state

    return process.env.XOA_PLAN > 2
      ? <Container>
        <form>
          <div className='form-group'>
            <SelectSubject ref='selectSubject' multi onChange={this._handleSelectSubject} />
          </div>
          <div className='form-group'>
            <SelectHighLevelObject ref='selectObject' multi onChange={this._handleSelectObjects} />
          </div>
          <ButtonGroup className='p-b-1'>
            {map(TYPES, type =>
              <ActionButton key={type} btnStyle={isAllSelected[type] ? 'success' : 'secondary'} size='small' icon={type.toLowerCase()} handler={this._toggleAll} handlerParam={type} />
            )}
          </ButtonGroup>
          <div className='form-group'>
            <SelectRole ref='selectAction' onChange={this._handleSelectRole} />
          </div>
          <ActionButton icon='add' btnStyle='success' handler={this._addAcl} disabled={isEmpty(subjects) || isEmpty(objects) || !action}>Create</ActionButton>
        </form>
        <br />
        <AclTable />
      </Container>
    : <Container><Upgrade place='dashboard' available={3} /></Container>
  }
}
