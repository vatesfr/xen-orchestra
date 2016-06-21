import _ from 'messages'
import ActionButton from 'action-button'
import assign from 'lodash/assign'
import Component from 'base-component'
import forEach from 'lodash/forEach'
import isEmpty from 'lodash/isEmpty'
import keyBy from 'lodash/keyBy'
import map from 'lodash/map'
import pickBy from 'lodash/pickBy'
import React from 'react'
import renderXoItem, { renderXoItemFromId } from 'render-xo-item'
import SortedTable from 'sorted-table'
import Upgrade from 'xoa-upgrade'
import { connectStore } from 'utils'
import { Container } from 'grid'
import { error } from 'notification'
import { SelectHighLevelObjects, SelectRole, SelectSubject } from 'select-objects'

import {
  createGetObjectsOfType,
  createSelector
} from 'selectors'

import {
  addAcl,
  removeAcl,
  subscribeAcls,
  subscribeGroups,
  subscribeRoles,
  subscribeUsers
} from 'xo'

const handleRoleChange = (role, {subject, object, action}) => {
  if (!role) {
    return
  }
  return removeAcl({subject, object, action}).then(() => addAcl({subject, object, action: role.id}))
}
const handleRemoveAcl = ({subject, object, action}) => removeAcl({subject, object, action}).catch(err => error('Remove ACL', err.message || String(err)))

@connectStore(() => {
  const getHosts = createGetObjectsOfType('host')
  const getNetworks = createGetObjectsOfType('network')
  const getPools = createGetObjectsOfType('pool')
  const getSrs = createGetObjectsOfType('SR')
  const getVms = createGetObjectsOfType('VM')

  const getHighLevelObjects = createSelector(
    getHosts,
    getNetworks,
    getPools,
    getSrs,
    getVms,
    (hosts, networks, pools, srs, vms) => assign(
      {},
      keyBy(hosts, 'id'),
      keyBy(networks, 'id'),
      keyBy(pools, 'id'),
      keyBy(srs, 'id'),
      keyBy(vms, 'id')
    )
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
    const unsubscribeRoles = subscribeRoles(roles => this.setState({roles: (keyBy(roles, 'id'))}, refresh))
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
    const ACL_COLUMS = [
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
        itemRenderer: acl => <SelectRole clearable={false} onChange={role => handleRoleChange(role, acl)} placeholder='Change Role' value={acl.action} />,
        sortCriteria: acl => (acl.action.name || '').toLowerCase()
      },
      {
        name: '',
        itemRenderer: acl => <ActionButton icon='delete' btnStyle='danger' handler={handleRemoveAcl} handlerParam={acl} />
      }
    ]

    return isEmpty(resolvedAcls)
    ? <p><em>No acls found</em></p>
    : <SortedTable collection={resolvedAcls} columns={ACL_COLUMS} />
  }
}

export default class Acls extends Component {
  constructor (props) {
    super(props)
    this.state = {
      subjects: [],
      objects: [],
      role: undefined
    }
  }

  _handleSelectObjects = objects => this.setState({objects})
  _handleSelectRole = role => this.setState({role})
  _handleSelectSubject = subjects => this.setState({subjects})

  _addAcl = async () => {
    const {
      subjects,
      objects,
      role
    } = this.state
    try {
      const promises = []
      forEach(subjects, subject => promises.push(...map(objects, object => addAcl({subject: subject.id, object: object.id, action: role.id}))))
      await Promise.all(promises)
      const { subject, object, action } = this.refs
      subject.value = []
      object.value = []
      action.value = ''
    } catch (err) {
      error('Add ACL(s)', err.message || String(err))
    }
  }

  render () {
    const {
      objects,
      role,
      subjects
    } = this.state

    return process.env.XOA_PLAN > 3
      ? <Container>
        <form>
          <div className='form-group'>
            <SelectSubject ref='subject' multi onChange={this._handleSelectSubject} />
          </div>
          <div className='form-group'>
            <SelectHighLevelObjects ref='object' multi onChange={this._handleSelectObjects} />
          </div>
          <div className='form-group'>
            <SelectRole ref='action' onChange={this._handleSelectRole} />
          </div>
          <ActionButton icon='add' btnStyle='success' handler={this._addAcl} disabled={isEmpty(subjects) || !role || isEmpty(objects)}>Create</ActionButton>
        </form>
        <br />
        <AclTable />
      </Container>
    : <Container><Upgrade place='dashboard' available={3} /></Container>
  }
}
