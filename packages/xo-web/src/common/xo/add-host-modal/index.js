import _ from 'intl'
import BaseComponent from 'base-component'
import Icon from 'icon'
import React from 'react'
import SingleLineRow from 'single-line-row'
import { Col } from 'grid'
import { connectStore } from 'utils'
import {
  createCollectionWrapper,
  createGetObjectsOfType,
  createSelector,
} from 'selectors'
import { forEach } from 'lodash'
import { getPatchesDifference } from 'xo'
import { SelectHost } from 'select-objects'

@connectStore(
  () => ({
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
  }),
  { withRef: true }
)
export default class AddHostModal extends BaseComponent {
  get value() {
    const { nHostMissingPatches, nPoolMissingPatches } = this.state
    if (
      process.env.XOA_PLAN < 2 &&
      (nHostMissingPatches > 0 || nPoolMissingPatches > 0)
    ) {
      return {}
    }

    return { host: this.state.host }
  }

  _getHostPredicate = createSelector(
    () => this.props.singleHosts,
    singleHosts => host => singleHosts[host.id]
  )

  _onChangeHost = async host => {
    if (host === null) {
      this.setState({
        host,
        nHostMissingPatches: undefined,
        nPoolMissingPatches: undefined,
      })
      return
    }

    const { master } = this.props.pool
    const hostMissingPatches = await getPatchesDifference(master, host.id)
    const poolMissingPatches = await getPatchesDifference(host.id, master)

    this.setState({
      host,
      nHostMissingPatches: hostMissingPatches.length,
      nPoolMissingPatches: poolMissingPatches.length,
    })
  }

  render() {
    const { nHostMissingPatches, nPoolMissingPatches } = this.state

    return (
      <div>
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
        {(nHostMissingPatches > 0 || nPoolMissingPatches > 0) && (
          <div>
            {process.env.XOA_PLAN > 1 ? (
              <div>
                {nPoolMissingPatches > 0 && (
                  <SingleLineRow>
                    <Col>
                      <span className='text-danger'>
                        <Icon icon='error' />{' '}
                        {_('missingPatchesPool', {
                          nMissingPatches: nPoolMissingPatches,
                        })}
                      </span>
                    </Col>
                  </SingleLineRow>
                )}
                {nHostMissingPatches > 0 && (
                  <SingleLineRow>
                    <Col>
                      <span className='text-danger'>
                        <Icon icon='error' />{' '}
                        {_('missingPatchesHost', {
                          nMissingPatches: nHostMissingPatches,
                        })}
                      </span>
                    </Col>
                  </SingleLineRow>
                )}
              </div>
            ) : (
              _('patchUpdateNoInstall')
            )}
          </div>
        )}
      </div>
    )
  }
}
