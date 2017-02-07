import _ from 'intl'
import BaseComponent from 'base-component'
import React from 'react'
import SingleLineRow from 'single-line-row'
import { Col } from 'grid'
import { connectStore } from 'utils'
import { createCollectionWrapper, createGetObjectsOfType, createSelector } from 'selectors'
import { forEach } from 'lodash'
import { SelectHost } from 'select-objects'

@connectStore(() => ({
  singleHosts: createSelector(
    (_, { pool }) => pool && pool.id,
    createGetObjectsOfType('host'),
    createCollectionWrapper((poolId, hosts) => {
      const visitedPools = {}
      const singleHosts = {}
      forEach(hosts, host => {
        const { $pool } = host
        if ($pool !== poolId) {
          const previousHost = visitedPools[$pool]
          if (previousHost) {
            delete singleHosts[previousHost]
          } else {
            const { id } = host
            singleHosts[id] = true
            visitedPools[$pool] = id
          }
        }
      })
      return singleHosts
    })
  )
}), { withRef: true })
export default class AddHostModal extends BaseComponent {
  get value () {
    return this.state
  }

  _getHostPredicate = createSelector(
    () => this.props.singleHosts,
    singleHosts => host => singleHosts[host.id]
  )

  render () {
    return <div>
      <SingleLineRow>
        <Col size={6}>{_('addHostSelectHost')}</Col>
        <Col size={6}>
          <SelectHost
            onChange={this.linkState('host')}
            predicate={this._getHostPredicate()}
            value={this.state.host}
          />
        </Col>
      </SingleLineRow>
    </div>
  }
}
