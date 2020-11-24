import _ from 'intl'
import filter from 'lodash/filter'
import forEach from 'lodash/forEach'
import includes from 'lodash/includes'
import intersection from 'lodash/intersection'
import keyBy from 'lodash/keyBy'
import map from 'lodash/map'
import PropTypes from 'prop-types'
import React, { Component } from 'react'
import reduce from 'lodash/reduce'
import renderXoItem from 'render-xo-item'
import { resolveIds } from 'utils'

import { subscribeGroups, subscribeUsers } from 'xo'

// ===================================================================

export class Subjects extends Component {
  static propTypes = {
    subjects: PropTypes.array.isRequired,
  }

  constructor(props) {
    super(props)
    this.state = {
      groups: {},
      users: {},
    }
  }

  componentWillMount() {
    const unsubscribeGroups = subscribeGroups(groups => {
      this.setState({
        groups: keyBy(groups, 'id'),
      })
    })
    const unsubscribeUsers = subscribeUsers(users => {
      this.setState({
        users: keyBy(users, 'id'),
      })
    })

    this.componentWillUnmount = () => {
      unsubscribeGroups()
      unsubscribeUsers()
    }
  }

  render() {
    const { state } = this

    return (
      <div>
        {map(this.props.subjects, id => {
          if (state.users[id]) {
            return renderXoItem(
              { type: 'user', ...state.users[id] },
              {
                className: 'mr-1',
              }
            )
          }

          if (state.groups[id]) {
            return renderXoItem(
              { type: 'group', ...state.groups[id] },
              {
                className: 'mr-1',
              }
            )
          }

          return (
            <span key={id} className='mr-1'>
              {_('unknownResourceSetValue')}
            </span>
          )
        })}
      </div>
    )
  }
}

export const computeAvailableHosts = (pools, srs, hostsByPool) => {
  const validHosts = reduce(
    hostsByPool,
    (result, hosts, poolId) => (includes(resolveIds(pools), poolId) ? result.concat(hosts) : result),
    []
  )

  const availableHosts = filter(validHosts, host => {
    let kept = false

    forEach(srs, sr => !(kept = intersection(sr.$PBDs, host.$PBDs).length > 0))

    return kept
  })
  return availableHosts
}
