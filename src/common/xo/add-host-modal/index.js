import _ from 'intl'
import BaseComponent from 'base-component'
import Icon from 'icon'
import React from 'react'
import SingleLineRow from 'single-line-row'
import { Col } from 'grid'
import { connectStore } from 'utils'
import { createCollectionWrapper, createGetObjectsOfType, createSelector, createGetObject } from 'selectors'
import { SelectHost } from 'select-objects'
import {
  differenceBy,
  forEach
} from 'lodash'

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
  ),
  poolMasterPatches: createSelector(
    createGetObject(
      (_, props) => props.pool.master
    ),
    ({ patches }) => patches
  )
}), { withRef: true })
export default class AddHostModal extends BaseComponent {
  get value () {
    if (process.env.XOA_PLAN < 2 && this.state.nMissingPatches) {
      return {}
    }

    return this.state
  }

  _getHostPredicate = createSelector(
    () => this.props.singleHosts,
    singleHosts => host => singleHosts[host.id]
  )

  _onChangeHost = host => {
    this.setState({
      host,
      nMissingPatches: host
       ? differenceBy(this.props.poolMasterPatches, host.patches, 'name').length
       : undefined
    })
  }

  render () {
    const { nMissingPatches } = this.state

    return <div>
      <SingleLineRow>
        <Col size={6}>{_('addHostSelectHost')}</Col>
        <Col size={6}>
          <SelectHost
            onChange={this._onChangeHost}
            predicate={this._getHostPredicate()}
            value={this.state.host}
          />
        </Col>
      </SingleLineRow>
      <br />
      {nMissingPatches > 0 && <SingleLineRow>
        <Col>
          <span className='text-danger'>
            <Icon icon='error' /> {process.env.XOA_PLAN > 1
              ? _('hostNeedsPatchUpdate', { patches: nMissingPatches })
              : _('hostNeedsPatchUpdateNoInstall')
            }
          </span>
        </Col>
      </SingleLineRow>}
    </div>
  }
}
