import PropTypes from 'prop-types'
import React from 'react'

import _ from './intl'
import Component from './base-component'
import constructQueryString from './construct-query-string'
import Icon from './icon'
import Link from './link'
import Tooltip from './tooltip'
import { connectStore } from './utils'
import { createCollectionWrapper, createGetObjectsOfType, createSelector } from './selectors'

@connectStore({
  containers: createSelector(createGetObjectsOfType('pool'), createGetObjectsOfType('host'), (pools, hosts) => ({
    ...pools,
    ...hosts,
  })),
  vms: createGetObjectsOfType('VM').pick((_, props) => props.vms),
})
export default class ZstdChecker extends Component {
  static propTypes = {
    vms: PropTypes.arrayOf(PropTypes.string).isRequired,
  }

  _getVmsWithoutZstd = createSelector(
    () => this.props.vms,
    () => this.props.containers,
    createCollectionWrapper((vms, containers) => {
      const vmIds = []
      for (const id in vms) {
        const container = containers[vms[id].$container]
        if (container !== undefined && !container.zstdSupported) {
          vmIds.push(id)
        }
      }
      return vmIds
    })
  )

  _getVmsWithoutZstdLink = createSelector(this._getVmsWithoutZstd, vms => ({
    pathname: '/home',
    query: {
      t: 'VM',
      s: constructQueryString({
        id: {
          __or: vms,
        },
      }),
    },
  }))

  render() {
    const nVmsWithoutZstd = this._getVmsWithoutZstd().length
    return nVmsWithoutZstd > 0 ? (
      <Tooltip content={_('notSupportedZstdTooltip')}>
        <Link className='text-warning' target='_blank' to={this._getVmsWithoutZstdLink()}>
          <Icon icon='alarm' />{' '}
          {_('notSupportedZstdWarning', {
            nVms: nVmsWithoutZstd,
          })}
        </Link>
      </Tooltip>
    ) : null
  }
}
