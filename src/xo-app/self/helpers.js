import _ from 'intl'
import forEach from 'lodash/forEach'
import keyBy from 'lodash/keyBy'
import map from 'lodash/map'
import propTypes from 'prop-types'
import React, { Component } from 'react'
import renderXoItem from 'render-xo-item'
import store from 'store'
import { getObject } from 'selectors'

import {
  subscribeGroups,
  subscribeUsers
} from 'xo'

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
            return renderXoItem({ type: 'user', ...state.users[id] }, {
              className: 'm-r-1'
            })
          }

          if (state.groups[id]) {
            return renderXoItem({ type: 'group', ...state.groups[id] }, {
              className: 'm-r-1'
            })
          }

          return <span key={id} className='m-r-1'>{_('unknownResourceSetValue')}</span>
        })}
      </div>
    )
  }
}
