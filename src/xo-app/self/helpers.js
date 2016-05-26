import Icon from 'icon'
import React, { Component } from 'react'
import _ from 'messages'
import forEach from 'lodash/forEach'
import keyBy from 'lodash/keyBy'
import map from 'lodash/map'
import store from 'store'
import { createGetObject } from 'selectors'

import {
  connectStore,
  propTypes
} from 'utils'

import {
  subscribeGroups,
  subscribeUsers
} from 'xo'

// ===================================================================

const getObject = createGetObject((_, id) => id)

// ===================================================================

export const resolveResourceSets = resourceSets => (
  map(resourceSets, resourceSet => {
    const { objects, ...attrs } = resourceSet
    const resolvedObjects = {}
    const resolvedSet = {
      ...attrs,
      missingObjects: [],
      objectsByType: resolvedObjects
    }
    const state = store.getState()

    forEach(objects, id => {
      const object = getObject(state, id)

      // Error, missing resource.
      if (!object) {
        resolvedSet.missingObjects.push(id)
        return
      }

      const { type } = object

      if (!resolvedObjects[type]) {
        resolvedObjects[type] = [ object ]
      } else {
        resolvedObjects[type].push(object)
      }
    })

    return resolvedSet
  })
)

// ===================================================================

@propTypes({
  subjects: propTypes.array.isRequired
})
export class Subjects extends Component {
  constructor (props) {
    super(props)
    this.state = {
      groups: {},
      users: {}
    }
  }

  componentWillMount () {
    const unsubscribeGroups = subscribeGroups(groups => {
      this.setState({
        groups: keyBy(groups, 'id')
      })
    })
    const unsubscribeUsers = subscribeUsers(users => {
      this.setState({
        users: keyBy(users, 'id')
      })
    })

    this.componentWillUnmount = () => {
      unsubscribeGroups()
      unsubscribeUsers()
    }
  }

  render () {
    const { state } = this

    return (
      <div>
        {map(this.props.subjects, id => {
          if (state.users[id]) {
            return (
              <span key={id} className='m-r-1'>
                <Icon icon='user' /> {state.users[id].email}
              </span>
            )
          }

          if (state.groups[id]) {
            return (
              <span key={id} className='m-r-1'>
                <Icon icon='group' /> {state.groups[id].name}
              </span>
            )
          }

          return <span key={id} className='m-r-1'>{_('unknownResourceSetValue')}</span>
        })}
      </div>
    )
  }
}

// ===================================================================

const OBJECT_TYPE_TO_ICON = {
  'VM-template': 'vm',
  'network': 'network',
  'SR': 'sr'
}

export const ObjectP = propTypes({
  object: propTypes.object.isRequired
})(connectStore(() => {
  const getPool = createGetObject(
    (_, props) => props.object.$pool
  )

  return (state, props) => ({
    pool: getPool(state, props)
  })
})(({ object, pool }) => {
  const icon = OBJECT_TYPE_TO_ICON[object.type]
  const { id } = object

  return (
    <span key={id} className='m-r-1'>
      <Icon icon={icon} /> {object.name_label || id} {pool && `(${pool.name_label || pool.id})`}
    </span>
  )
}))
