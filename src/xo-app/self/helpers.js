import _ from 'intl'
import keyBy from 'lodash/keyBy'
import map from 'lodash/map'
import propTypes from 'prop-types'
import React, { Component } from 'react'
import renderXoItem from 'render-xo-item'

import {
  subscribeGroups,
  subscribeUsers
} from 'xo'

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
              className: 'mr-1'
            })
          }

          if (state.groups[id]) {
            return renderXoItem({ type: 'group', ...state.groups[id] }, {
              className: 'mr-1'
            })
          }

          return <span key={id} className='mr-1'>{_('unknownResourceSetValue')}</span>
        })}
      </div>
    )
  }
}
